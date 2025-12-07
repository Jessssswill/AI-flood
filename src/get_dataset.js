import fs from "fs";
import csv from "csv-parser";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export async function fetchDataset() {
  const locations = [];

  await new Promise(resolve => {
    fs.createReadStream("./locations.csv")
      .pipe(csv())
      .on("data", row => locations.push(row))
      .on("end", resolve);
  });

  const outputRows = [];
  const header = "city,lat,lon,date,temp_max,temp_min,precipitation\n";

  for (const loc of locations) {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Asia/Jakarta&past_days=30`;

    const res = await fetch(url);
    const data = await res.json();

    const days = data.daily?.time ?? [];

    for (let i = 0; i < days.length; i++) {
      const row = [
        loc.id,
        loc.lat,
        loc.lon,
        days[i],
        data.daily.temperature_2m_max[i],
        data.daily.temperature_2m_min[i],
        data.daily.precipitation_sum[i]
      ].join(",");

      outputRows.push(row);
    }
  }

  fs.appendFileSync("./dataset.csv", header + outputRows.join("\n"));

  console.log("dataset.csv created");
}
