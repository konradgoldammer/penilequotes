const axios = require("axios").default;
const Jimp = require("jimp");
const pluralize = require("pluralize");
const WordPOS = require("wordpos");

const generatePenileQuote = () =>
  new Promise((resolve, reject) => {
    (async () => {
      try {
        const identifyNouns = (string) =>
          new Promise((resolve, reject) => {
            (async () => {
              try {
                const wordpos = new WordPOS();
                const { nouns, verbs, adjectives, adverbs, rest } =
                  await wordpos.getPOS(string);
                const verifiedNouns = nouns.filter(
                  (noun) =>
                    !verbs.includes(noun) &&
                    !adjectives.includes(noun) &&
                    !adverbs.includes(noun) &&
                    !rest.includes(noun) &&
                    !noun.toLowerCase() !== "us"
                );
                resolve(verifiedNouns);
              } catch (err) {
                reject(err);
              }
            })();
          });

        const isValidQuote = (quote, nouns) => {
          const wordpos = new WordPOS();
          const includesNoun = nouns.length > 0;
          const includesForbiddenChars =
            quote.includes("~") || quote.includes('"');
          return includesNoun && !includesForbiddenChars;
        };

        const getQuote = () =>
          new Promise((resolve, reject) => {
            const options = {
              method: "POST",
              url: "https://motivational-quotes1.p.rapidapi.com/motivation",
              headers: {
                "content-type": "application/json",
                "x-rapidapi-host": "motivational-quotes1.p.rapidapi.com",
                "x-rapidapi-key":
                  "a32511e097msh8822beb67ddd703p13a629jsn287a7f0df201",
              },
              data: { key1: "value", key2: "value" },
            };

            axios
              .request(options)
              .then((res) => resolve(res.data))
              .catch((err) => reject(err));
          });

        // Get qoute
        let quoteArr;
        let quote;
        let author;
        let nouns;
        let i = 0;
        do {
          if (i > 20) {
            throw new Error("Last 20 fetched quotes were not valid");
          }
          quoteArr = (await getQuote()).split(/\r\n|\r|\n/);
          quote = quoteArr[0].replaceAll('"', "");
          author = quoteArr[1];
          nouns = await identifyNouns(quote);
          console.log(
            `Fetched quote (nouns: ${nouns.length}, quote: ${quote})`
          );
          i++;
        } while (!isValidQuote(quote, nouns));

        const lastNoun = nouns[nouns.length - 1];

        // Replace last noun with penis lmao
        const penileQuote = quote.replaceAll(
          lastNoun,
          lastNoun.split("")[0] === lastNoun.split("")[0].toLowerCase()
            ? "penis"
            : "Penis"
        );

        console.log(
          `Generated quote (original: ${quote}, penile quote: ${penileQuote})`
        );

        return resolve({ penileQuote, author, originalQuote: quote });
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
        const font = await Jimp.loadFont("./fonts/regular.fnt");
        const penisFont = await Jimp.loadFont("./fonts/penis.fnt");
        const spaceWidth = 20;

        const bgHeight = 1080;
        const bgWidth = 1080;
        const logoHeight = 120;
        const logoWidth = 120;

        const groupSubStrings = (
          subStrings,
          font,
          bgHeight,
          bgWidth,
          spaceWidth
        ) =>
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
                    const columnWidth =
                      (await Jimp.measureText(font, sub)) + spaceWidth;
                    if (rowWidth + columnWidth < maxAllowedWidth) {
                      columns.push({ content: sub, width: columnWidth });
                      rowWidth += columnWidth;
                      continue;
                    }
                    if (columns.length === 0) {
                      return reject(
                        new Error("Word too long - cannot be used")
                      );
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

        const subStrings = text.split(" ");

        const { rows, maxWidth, sumHeight } = await groupSubStrings(
          subStrings,
          font,
          bgHeight,
          bgWidth,
          spaceWidth
        );

        if (rows.length > 6) {
          return resolve({ success: false });
        }

        let marginTop = (bgHeight - sumHeight) / 2;
        for (row of rows) {
          let marginLeft = (bgWidth - maxWidth) / 2;
          for (column of row.columns) {
            if (
              column.content.includes("penis") ||
              column.content.includes("Penis")
            ) {
              const penis = column.content.substring(0, 5); // bc penis is 5 chars long
              bg.print(penisFont, marginLeft, marginTop, penis);
              const penisWidth = await Jimp.measureText(penisFont, penis);
              marginLeft += penisWidth;
              if (column.content.length > 5) {
                bg.print(font, marginLeft, marginTop, column.content[5]);
                const charWidth = await Jimp.measureText(
                  font,
                  column.content[5]
                );
                marginLeft += charWidth;
              }
              marginLeft += spaceWidth;
              continue;
            }

            bg.print(font, marginLeft, marginTop, column.content);
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

        console.log(`Created image`);

        return resolve({ success: true, outputPath });
      } catch (err) {
        reject(err);
      }
    })();
  });

const generatePenileQuoteImage = () =>
  new Promise((resolve, reject) => {
    (async () => {
      try {
        let penileQuote;
        let outputPath;
        let success = false;
        do {
          const obj1 = await generatePenileQuote();
          penileQuote = obj1.penileQuote;
          const obj2 = await createImage(penileQuote);
          outputPath = obj2.outputPath;
          success = obj2.success;
        } while (!success);
      } catch (err) {
        console.error(err);
      }
    })();
  });

module.exports = generatePenileQuote;
