const Jimp = require("jimp");

const groupSubStrings = (subStrings, font, bgHeight, bgWidth) =>
  new Promise((resolve, reject) => {
    (async () => {
      try {
        const subs = [...subStrings];

        let maxWidth = 0;

        const sumMinMargins = (bgWidth / 100) * 10 * 2; // 10% on each side
        const maxAllowedWidth = bgWidth - sumMinMargins;

        const groups = [];

        do {
          let totalWidth = 0;
          const group = [];

          for (sub of subs) {
            const subWidth = await Jimp.measureText(font, sub);
            if (totalWidth + subWidth < maxAllowedWidth) {
              group.push(sub);
              totalWidth += await Jimp.measureText(font, sub);
              continue;
            }
            if (group.length === 0) {
              return reject(new Error("Word too long - cannot be used"));
            }
            break;
          }

          subs.splice(0, group.length);

          if (totalWidth > maxWidth) {
            maxWidth = totalWidth;
          }

          groups.push(group);
        } while (subs.length !== 0);

        resolve({ groups, maxWidth });
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
        const font = await Jimp.loadFont(Jimp.FONT_SANS_128_WHITE);

        const bgHeight = 1080;
        const bgWidth = 1080;
        const logoHeight = 120;
        const logoWidth = 120;

        const subStrings = text.split(" ");

        console.log(subStrings);
        const obj = await groupSubStrings(subStrings, font, bgHeight, bgWidth);
        console.log(obj);

        bg.print(font, 0, 0, text);

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
    await createImage("Behind every great man there is a great penis.");
    await createImage("a");
    // console.log(
    //   await Jimp.measureText(await Jimp.loadFont(Jimp.FONT_SANS_14_BLACK), "s")
    // );
  } catch (e) {
    console.error(e);
  }
})();
