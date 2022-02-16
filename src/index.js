import config from "config";
import { generatePenileQuoteImage } from "./content-creation/index.js";
import Instagram from "instagram-web-api";
import mongoose from "mongoose";
import { Quote } from "./models/Quote.js";

(async () => {
  try {
    console.log("Start...");

    const client = new Instagram({
      username: config.get("username"),
      password: config.get("password"),
    });

    const authenticated = await client.login();

    if (!authenticated) {
      throw new Error("False credentials");
    }

    console.log(`Logged into Instagram as ${client.credentials.username}`);

    await mongoose.connect(config.get("mongoURI"));
    console.log("Connected to MongoDB");

    // Get latest post to check when to post new
    const latestQuote = await Quote.findOne({}, {}, { sort: { date: -1 } });

    if (latestQuote) {
      const millisUntilNextQuote =
        latestQuote.date.getTime() +
        config.get("intervalLength") * 60 * 60 * 1000 -
        Date.now();

      if (millisUntilNextQuote >= 0) {
        console.log(
          `Sleeping for next quote @ ${new Date(
            Date.now() + millisUntilNextQuote
          ).toLocaleString()}`
        );
        await sleep(millisUntilNextQuote);
      }
    }

    while (true) {
      console.log("New iteration...");

      const startTime = Date.now();

      const { outputPath, author } = await generatePenileQuoteImage();

      await client.uploadPhoto({
        photo: outputPath,
        caption: `${author}`,
        post: "feed",
      });

      console.log("Uploaded to Instagram");

      const duration = Date.now() - startTime;

      console.log(`Iteration complete in ${duration} secs`);

      // Sleep
      const sleepLength =
        config.get("intervalLength") * 60 * 60 * 1000 - duration;
      console.log(
        `Sleeping until ${new Date(
          Date.now() + sleepLength
        ).toLocaleString()}...`
      );
      await sleep(sleepLength);
    }
  } catch (err) {
    console.error(`Error: ${err}`);

    mongoose.connection.close();

    console.log(
      `Sleeping until ${new Date(Date.now() + 2147483647).toLocaleString()}...`
    );

    await sleep(2147483647);

    return;
  }
})();

const sleep = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};
