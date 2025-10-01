import useBluetooth from "./hooks/useBluetooth";
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

export default function App() {
  const { isConnected, isConnecting, error, connect, setColor, lastColor } =
    useBluetooth();

  // const [r, g, b] = lastColor;

  function handleChangeColor() {
    const r = Number(prompt("enter a RED value (0-255)"));
    const g = Number(prompt("enter a GREEN value (0-255)"));
    const b = Number(prompt("enter a BLUE value (0-255)"));

    setColor(r, g, b);
  }
  

  return (
    <>
      <button
        className="testName"
        onClick={connect}
        disabled={isConnected || isConnecting}
      >
        Click me to start
      </button>
      <button className="changeName" onClick={handleChangeColor}>
        ClICK ME TO CHANGE COLOR
      </button>
    </>
  );
}
