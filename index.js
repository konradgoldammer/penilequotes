const Jimp = require("jimp");

const groupSubStrings = (subStrings, font, bgHeight, bgWidth) =>
  new Promise((resolve, reject) => {
    (async () => {
      try {
        const subs = [...subStrings];

        let maxWidth = 0;
        let sumHeight = 0;

        const sumMinMargins = (bgWidth / 100) * 10 * 2; // 10% on each side
        const maxAllowedWidth = bgWidth - sumMinMargins;

        const rows = [];

        do {
          let rowWidth = 0;
          const columns = [];

          for (sub of subs) {
            const columnWidth = await Jimp.measureText(font, sub);
            if (rowWidth + columnWidth < maxAllowedWidth) {
              columns.push({ content: sub, width: columnWidth });
              rowWidth += await Jimp.measureText(font, sub);
              continue;
            }
            if (columns.length === 0) {
              return reject(new Error("Word too long - cannot be used"));
            }
            break;
          }

          subs.splice(0, columns.length);

          if (rowWidth > maxWidth) {
            maxWidth = rowWidth;
          }

          const height = await Jimp.measureTextHeight(
            font,
            columns.map((column) => column.content).join("")
          );

          sumHeight += height;

          rows.push({ columns, width: rowWidth, height });
        } while (subs.length !== 0);

        resolve({ rows, maxWidth, sumHeight });
      } catch (err) {
        reject(err);
      }
    })();
  });

const createImage = (text) =>
  new Promise((resolve, reject) => {
    (async () => {
      try {
        if (!text) {
          return reject(new Error("Text is necessary for image creation"));
        }

        if (typeof text !== "string") {
          return reject(new Error("Text must be string"));
        }

        const outputPath = "output/edited.jpg";

        const bg = await Jimp.read("images/bg.jpg");
        const logo = await Jimp.read("images/logo.jpg");
        const font = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);

        const bgHeight = 1080;
        const bgWidth = 1080;
        const logoHeight = 120;
        const logoWidth = 120;

        const subStrings = text.replaceAll(" ", " ~").split("~");

        console.log(subStrings);

        const { rows, maxWidth, sumHeight } = await groupSubStrings(
          subStrings,
          font,
          bgHeight,
          bgWidth
        );

        let marginTop = (bgHeight - sumHeight) / 2;
        for (row of rows) {
          let marginLeft = (bgWidth - maxWidth) / 2;
          for (column of row.columns) {
            bg.print(font, marginLeft, marginTop, column.content);
            if (column.content.includes("penis")) {
              const penis = column.content.substring(0, 5); // bc penis is 5 chars long
              bg.print(
                await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK),
                marginLeft,
                marginTop,
                penis
              );
            }
            marginLeft += column.width;
          }
          marginTop += row.height;
        }

        logo.resize(logoHeight, logoWidth);

        bg.blit(
          logo,
          (bgWidth - logoWidth) / 2,
          bgHeight - logoHeight - (bgHeight / 100) * 5
        );

        bg.write(outputPath);

        resolve(outputPath);
      } catch (e) {
        reject(e);
      }
    })();
  });

(async function () {
  try {
    await createImage("I am a penis quote.");
    // console.log(
    //   await Jimp.measureText(await Jimp.loadFont(Jimp.FONT_SANS_14_BLACK), "s")
    // );
  } catch (e) {
    console.error(e);
  }
})();
