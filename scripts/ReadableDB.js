const fs = require("fs");
const path = require("path");

const dbpath = process.cwd() + path.sep + "db.json";
(new Promise((resolve, reject) => {
	const stream = fs.createReadStream(dbpath, 'utf8')
	console.log("received stream");
	const chunks = [];
	stream.on('data', chunk => chunks.push(chunk));
	stream.on('end', () => resolve(chunks.join('')));
	stream.on('error', err => reject(err));
})).then(rawJson => {
	console.log("chunked stream");
	const parsedDB = JSON.parse(rawJson);
	const pretty = JSON.stringify(parsedDB, null, 2);
	fs.writeFile(dbpath, pretty, () => {
		console.log("File Written");
	});
}).catch(error => {
	console.log("Error Encountered", error);
});
