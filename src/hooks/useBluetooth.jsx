import { useState, useEffect } from "react";

// ======================================================
// КОНСТАНТИ ДЛЯ ДИНАМІЧНОГО ПОШУКУ
// ======================================================
const ELK_BLEDOM_SERVICE_UUID = "0000fff0-0000-1000-8000-00805f9b34fb";
// Список відомих Характеристик запису (0xFFF3 - наша робоча, 0xFFE4 - поширений варіант)
const WRITE_CHARACTERISTICS_CANDIDATES = [
  "0000fff3-0000-1000-8000-00805f9b34fb",
  "0000ffe4-0000-1000-8000-00805f9b34fb",
  "0000fffc-0000-1000-8000-00805f9b34fb",
];

function createColorCommand(r, g, b) {
  const buffer = new ArrayBuffer(9);
  const dataView = new DataView(buffer);

  dataView.setUint8(0, 0x7e);
  dataView.setUint8(1, 0x07);
  dataView.setUint8(2, 0x05);
  dataView.setUint8(3, 0x03);
  dataView.setUint8(4, r); // R
  dataView.setUint8(5, g); // G
  dataView.setUint8(6, b); // B
  dataView.setUint8(7, 0x00);
  dataView.setUint8(8, 0xef);

  return dataView.buffer;
}

async function findWorkingCharacteristic(service) {
  for (const uuid of WRITE_CHARACTERISTICS_CANDIDATES) {
    try {
      console.log(`Спроба знайти UUID: ${uuid}`);

      // Якщо Характеристика існує, повернемо її
      const characteristic = await service.getCharacteristic(uuid);

      console.log(`✅ Знайдено робочий WRITE UUID: ${uuid}`);
      return characteristic;
    } catch (error) {
      // Якщо NotFoundError, переходимо до наступного UUID
      continue;
    }
  }

  // Якщо жоден UUID не спрацював
  throw new Error(
    "Не знайдено жодної робочої Характеристики запису в Сервісі FFE0."
  );
}

export default function useBluetooth() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState("");

  const [device, setDevice] = useState(null);
  const [characteristic, setCharacteristic] = useState(null);
  const [lastColor, setLastColor] = useState([128, 18, 36]);

  const connect = async () => {
    if (!navigator.bluetooth) {
      setError("Web Bluetooth не підтримується цим браузером.");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // 1. Запит пристрою (Потрібен жест користувача)
      const newDevice = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: "ELK" }],
        optionalServices: [0xffe0, 0xfff0, 0xffe5],
      });

      console.log(newDevice);

      // 2. Підключення до GATT-сервера
      const server = await newDevice.gatt.connect();

      // 3. Пряме отримання Service UUID (0xFFE0)
      const service = await server.getPrimaryService(ELK_BLEDOM_SERVICE_UUID);

      // 4. Динамічний пошук робочої Характеристики
      const workingCharacteristic = await findWorkingCharacteristic(service);

      // Оновлення стану React
      setDevice(newDevice);
      setCharacteristic(workingCharacteristic);
      setIsConnected(true);

      console.log("✅ Підключення та ініціалізація успішні!");

      // Тест: Відправляємо білий колір
      const command = createColorCommand(128, 18, 36);
      await workingCharacteristic.writeValue(command);
    } catch (e) {
      setError(e.message || "Помилка підключення/ініціалізації.");
      setIsConnected(false);
      console.error("Помилка підключення:", e);
    } finally {
      setIsConnecting(false);
    }
  };

  // --------------------------------------------------
  // B. ФУНКЦІЯ КЕРУВАННЯ КОЛЬОРОМ
  // --------------------------------------------------
  const setColor = async (r, g, b) => {
    if (!characteristic) {
      setError("Не підключено до Характеристики для запису.");
      return;
    }

    try {
      const command = createColorCommand(r, g, b);
      await characteristic.writeValue(command);

      // ✅ ОНОВЛЕННЯ СТАНУ: зберігаємо встановлені значення RGB
      setLastColor([r, g, b]);
    } catch (e) {
      setError(`Помилка запису команди: ${e.message}`);
      console.error("Помилка запису:", e);
    }
  };

  // --------------------------------------------------
  // C. useEffect ДЛЯ ОЧИЩЕННЯ (Cleanup)
  // --------------------------------------------------
  useEffect(() => {
    const handleDisconnect = () => {
      console.log("Пристрій розірвав з'єднання.");
      setIsConnected(false);
      setCharacteristic(null);
    };

    if (device) {
      // Встановлюємо слухач для автоматичного оновлення стану
      device.addEventListener("gattserverdisconnected", handleDisconnect);
    }

    return () => {
      // Очищення: відключення пристрою при розмонтуванні компонента
      if (device && device.gatt.connected) {
        device.gatt.disconnect();
      }
      if (device) {
        device.removeEventListener("gattserverdisconnected", handleDisconnect);
      }
    };
  }, [device]); // Запускається при зміні об'єкта пристрою

  return {
    isConnected,
    isConnecting,
    error,
    connect,
    setColor,
    lastColor,
  };
}
