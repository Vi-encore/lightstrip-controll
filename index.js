const btn = document.querySelector(".test");
const changeBtn = document.querySelector(".change");

btn.addEventListener("click", () => {
  navigator.bluetooth
    .requestDevice({
      // Використовуйте фільтр по префіксу, щоб зменшити список
      filters: [{ namePrefix: "ELK" }],

      // 🛑 Ключовий момент: Явно запитуємо доступ до FFE5.
      // Якщо він запрацює після скидання кешу, ви підключитеся.
      optionalServices: [0xffe0, 0xfff0, 0xffe5],
      // optionalServices: [0xffe5],
    })
    .then((device) => {
      console.log("Connected to device:", device);
      getUUID(device);
    })
    .catch((error) => {
      // ...
      console.error("Connection failed:", error);
    });
  // ...
});

function getUUID(device) {
  console.log(`Підключення до GATT-сервера пристрою: ${device.name}...`);

  device.gatt
    .connect()
    .then((server) => {
      // 1. Пряме звернення до відомого Сервісу 0xFFE0
      // Це обхід проблеми з getPrimaryServices()
      return server.getPrimaryService(ELK_BLEDOM_SERVICE_UUID);
    })
    .then((service) => {
      // 2. Динамічний пошук робочої Характеристики
      return findWorkingCharacteristic(service);
    })
    .then((characteristic) => {
      // 3. Зберігаємо робочу Характеристику глобально
      characteristics_main = characteristic;

      console.log("✅ Ініціалізацію завершено. Характеристика збережена.");

      // Тестова команда (Спробуйте Червоний)
      const commandTest = createColorCommand(128, 18, 36);
      // 🛑 Не забудьте про .buffer, якщо createColorCommand повертає DataView!
      return characteristic.writeValue(commandTest.buffer);
    })
    .then(() => {
      console.log("✅ Тестова команда надіслана. Стрічка має змінити колір.");
    })
    .catch((error) => {
      console.error(
        "❌ КРИТИЧНА ПОМИЛКА: Не вдалося знайти Сервіс або робочий UUID:",
        error
      );
    });
}

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

// Зробіть цю змінну глобальною, щоб мати до неї доступ
let characteristics_main = null;

// ======================================================
// ХЕЛПЕР: ДИНАМІЧНИЙ ПОШУК ХАРАКТЕРИСТИКИ
// ======================================================
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

  return dataView;
}

// function showDevice(device) {
//   console.log(`Підключення до GATT-сервера пристрою: ${device.name}...`);

//   device.gatt
//     .connect()
//     .then((server) => {
//       // Отримати ВСІ основні сервіси
//       return server.getPrimaryServices();
//     })
//     .then((services) => {
//       console.log("Знайдено наступні Сервіси:");
//       console.log(services); // <== Перевірте цей масив!

//       services.forEach((service) => {
//         console.log(`- Service UUID: ${service.uuid}`);

//         // Отримати Характеристики для кожного Сервісу
//         service.getCharacteristics().then((characteristics) => {
//           characteristics.forEach((char) => {
//             console.log(char);
//             console.log(
//               `   - Characteristic UUID: ${char.uuid} (Permissions: ${
//                 char.properties.write ? "WRITE" : "READ/NOTIFY"
//               })`
//             );
//           });
//         });
//       });
//     })
//     .catch((error) => {
//       console.error("Помилка при виявленні сервісів:", error);
//     });
// }

// // Команда для УВІМКНЕННЯ (Turn ON)
// function createOnCommand() {
//     return new Uint8Array([0xCC, 0x23, 0x33]);
// }

// // Команда для ВИМКНЕННЯ (Turn OFF)
// function createOffCommand() {
//     return new Uint8Array([0xCC, 0x24, 0x33]);
// }

// // Команда для Білого кольору
// function createWhiteCommand(brightnessW = 255) {
//     const buffer = new ArrayBuffer(9);
//     const dataView = new DataView(buffer);

//     dataView.setUint8(0, 0x7E);
//     dataView.setUint8(1, 0x04);
//     dataView.setUint8(2, 0x05); // White mode
//     dataView.setUint8(3, 0x03);
//     dataView.setUint8(4, brightnessW); // W value R
//     dataView.setUint8(5, brightnessW); // W value G
//     dataView.setUint8(6, brightnessW); // W value B
//     dataView.setUint8(7, 0x00);
//     dataView.setUint8(8, 0xEF);

//     return new Uint8Array(buffer);
// }

changeBtn.addEventListener("click", () => changeColor(characteristics_main));

function changeColor(characteristic) {
  // console.log(characteristic);
  // console.log(typeof characteristic);

  const r = Number(prompt("enter a RED value (0-255)"));
  const g = Number(prompt("enter a GREEN value (0-255)"));
  const b = Number(prompt("enter a BLUE value (0-255)"));

  const command = createColorCommand(r, g, b);

  return characteristic.writeValue(command);
}
