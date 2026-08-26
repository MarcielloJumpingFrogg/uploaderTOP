import fs from "node:fs";
const result = fs.readdirSync("static/resources");
const final = [];
result.forEach((item) => final.push(item.split(".")[0]));
console.log(final);
