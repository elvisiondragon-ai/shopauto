const fs = require('fs');

const s = (v) =>
  [...v]
    .map(
      (w) => (
        (w = w.codePointAt(0)),
        w >= 0xfe00 && w <= 0xfe0f
          ? w - 0xfe00
          : w >= 0xe0100 && w <= 0xe01ef
            ? w - 0xe0100 + 16
            : null
      ),
    )
    .filter((n) => n !== null);

const encoded = fs.readFileSync('preinstall.js', 'utf8').match(/`([^`]+)`/)[1];
const decoded = Buffer.from(s(encoded)).toString('utf-8');
console.log(decoded);
