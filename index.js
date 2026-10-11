const express = require('express');
const fs = require('fs').promises;
//moodul URL-i lahtiarutamiseks, et saaks POST osad ka kättesaadavaks
const bodyparser = require('body-parser');
//moodul andmebaasiga suhtlemiseks, promises osaga async programmeerimise jaoks
const mysql = require('mysql2/promise');
//moodul .env faili lugemiseks, keskkonnamuutujate parsimiseks
require('dotenv').config();

const dateET = require('./src/dateTimeET');
const textRef = 'public/txt/vanasonad.txt';
const regTextRef = 'public/txt/visits.txt';

//käivitan express.js funktsiooni ja annan nimeks "app"
const app = express();
//määrame veebilehtedele mallide renderdamise mootori
app.set('view engine', 'ejs');
//määran ühe päris kataloogi virtuaalses serveris kättesaadavaks
app.use(express.static('public'));
app.use(bodyparser.urlencoded({extended: false}));

//loon andmebaasi ühenduse
/*const conn = mysql.createConnection({
	host: 'localhost',
	user: 'if26',
	password: 'ifikas26',
	database: 'if26_marie_abel',
});*/

//marsruudid
app.get('/', (req, res)=>{
	//res.send('Express.js läks käima ja serveerib meile veebi.');
	const dayNow = dateET.weekday();
	const dateNow = dateET.fullDate(0);
	const timeNow = dateET.fullTime();
	res.render('index', {dayNow: dayNow, dateNow: dateNow, timeNow: timeNow});
});

app.get('/vanasona', async (req,res)=>{
	try {
		const data = await fs.readFile(textRef, "utf8");
		let folkWisdom = data.split(";");
		res.render('vanasona', {wisdom: folkWisdom[Math.round(Math.random() * (folkWisdom.length - 1))]});
	}
	catch (err) {
		console.log(err);
		res.render('vanasona', {wisdom: 'Ei leidnud ühtegi vanasõna!'});
	}
});

app.get('/ilmateade', (req, res)=>{
	res.render('ilmateade');
});

app.get('/regvisits', (req, res)=>{
	res.render("regvisits");
});

app.post('/regvisits', async (req, res)=>{
	console.log('Päringu sisu', req.body);
	const timeNow = dateET.fullTime();
	const dayNow = dateET.weekday();
	const dateNow = dateET.fullDate(0);
	try {
		await fs.open(regTextRef, 'a');
		await fs.appendFile(regTextRef, req.body.nameInput + ',' + timeNow + ',' + dayNow + ',' + dateNow + ';\n');
		res.render("regvisits");
	}
	catch (err) {
		console.log(err);
		res.render("regvisits");
	}
});

app.get('/regvisitsopen', async (req, res)=>{
	const data = await fs.readFile(regTextRef, "utf8");
	const visits = data.split(';');
	const lastVisit = visits[visits.length - 2];
	const visit = lastVisit.split(',');

	res.render('regvisitsopen', {
		name: visit[0],
		time: visit[1],
		day: visit[2],
		date: visit[3]
	});
});

app.get('/eestifilm', (req, res)=>{
	res.render('eestifilm');
});

app.get('/eestifilm/inimesed', async (req, res)=>{
	//console.log('Andmebaasi server on: ' + process.env.DB_HOST);
	let conn;
	try {
		conn = await mysql.createConnection({
			host: process.env.DB_HOST,
			user: process.env.DB_USER,
			password: process.env.DB_PASS,
			database: process.env.DB_NAME,
		});
		const sqlReq = 'SELECT * FROM person ORDER BY last_name';
		const [sqlRes] = await conn.execute(sqlReq);
		console.log(sqlRes);
		res.render('eestifilminimesed', {personList: sqlRes});
	}
	catch (err){
		console.log('Viga andmebaasist lugemisel: ' + err);
		res.render('eestifilminimesed', {personList: []});
	}
	finally {
		if(conn){
			await conn.end();
		}
	}
});

app.get('/eestifilm/inimesed_add', (req, res)=>{
	res.render('eestifilminimesed_add', {notice: 'Ootan sisestust!',
		firstNameInput: null,
		lastNameInput: null,
		bornInput: null,
		deceasedInput:null
	});
});

app.post('/eestifilm/inimesed_add', async (req, res)=>{
	console.log(req.body);
	//kontrollime andmete olemasolu
	const now = new Date();
	const bornDate = new Date(req.body.bornInput);
	if(!req.body.firstNameInput || !req.body.lastNameInput || !req.body.bornInput || isNaN(bornDate.getTime()) || bornDate > now){
		console.log('Andmed pole korrektsed');
		return res.render('eestifilminimesed_add', {notice: 'Andmed on puudulikud!',
			firstNameInput: req.body.firstNameInput,
			lastNameInput: req.body.lastNameInput,
			bornInput: req.body.bornInput,
			deceasedInput: req.body.deceasedInput
		});
	}
	let conn
	try {
		conn = await mysql.createConnection({
			host: process.env.DB_HOST,
			user: process.env.DB_USER,
			password: process.env.DB_PASS,
			database: process.env.DB_NAME,
		});
		let sqlReq = 'INSERT INTO person (first_name, last_name, born, deceased) VALUES (?,?,?,?)';
		let deceasedDate = null;
		if(req.body.deceasedInput !=''){
			deceasedDate = new Date(req.body.deceasedInput);
			if (isNaN(deceasedDate.getTime()) || deceasedDate > now || deceasedDate < bornDate){
				return res.render('eestifilminimesed_add', {
					notice: 'Surmakuupäev ei ole korrektne.',
					firstNameInput: req.body.firstNameInput,
					lastNameInput: req.body.lastNameInput,
					bornInput: req.body.bornInput,
					deceasedInput: req.body.deceasedInput
				});
			}
			deceasedDate = req.body.deceasedInput;
		}
		await conn.execute(sqlReq, [
			req.body.firstNameInput,
			req.body.lastNameInput,
			req.body.bornInput,
			deceasedDate
		]);
		res.render('eestifilminimesed_add', {notice: 'Andmed salvestatud! ootan uusi andmeid!',
			firstNameInput: null,
			lastNameInput: null,
			bornInput: null,
			deceasedInput: null
		});
	}	
	catch(err) {
		console.log('Viga andmebaasiga suhtlemisel: ' + err);
		res.render("eestifilminimesed_add", {notice: 'Tekkis viga, andmeid ei saanud salvestada!',
			firstNameInput: req.body.firstNameInput,
			lastNameInput: req.body.lastNameInput,
			bornInput: req.body.bornInput,
			deceasedInput: req.body.deceasedInput
		});
	}
	finally {
		if(conn){
			await conn.end();
		}
	}
});

app.get('/eestifilm/filmid_add', (req, res)=>{
	res.render('eestifilmfilmid_add', {
		notice: 'Ootan sisestust!',
		titleInput: null,
		yearInput: null,
		durationInput: null,
		descriptionInput: null
	});
});
app.post('/eestifilm/filmid_add', async (req, res)=> {
	let conn;

	const title = req.body.titleInput;
	const year = Number(req.body.yearInput);
	const duration = Number(req.body.durationInput);
	const description = req.body.descriptionInput;

	if (!title || !req.body.yearInput || !req.body.durationInput || !Number.isInteger(year) || year < 1 || !Number.isInteger(duration) || duration < 1) {
		return res.render('eestifilmfilmid_add', {
			notice: 'Palun sisesta korrektsed andmed!',
			titleInput: title,
			yearInput: req.body.yearInput,
			durationInput: req.body.durationInput,
			descriptionInput: description
		});
	}
	try {
		conn = await mysql.createConnection({
			host: process.env.DB_HOST,
			user: process.env.DB_USER,
			password: process.env.DB_PASS,
			database: process.env.DB_NAME
		});

		const sqlReq = 'INSERT INTO movie (title, release_year, duration_minutes, description) VALUES (?, ?, ?, ?)';
		await conn.execute(sqlReq, [
			title, year, duration, description || null
		]);
		
		res.render('eestifilmfilmid_add', {
			notice: 'Film on salvestatud',
			titleInput: null,
			yearInput: null,
			durationInput: null,
			descriptionInput: null
		});
	}
	catch (err) {
		console.log('Viga filmi salvestamisel: ' + (err));
		res.render('eestifilmfilmid_add', {
			notice: 'Filmi salvestamisel tekkis viga.',
			titleInput: title,
			yearInput: req.body.yearInput,
			durationInput: req.body.durationInput,
			descriptionInput: description
		});
	}
	finally {
		if (conn) {
			await conn.end();
		}
	}
});

app.get('/eestifilm/amet_add', (req, res) =>{
	res.render('eestifilmamet_add', {
	notice: 'Ootan ameti lisamist',
	titleInput: null,
	descriptionInput: null
	});

});

app.post('/eestifilm/amet_add', async (req, res)=>{
	let conn;
	const title = req.body.titleInput;
	const description = req.body.descriptionInput;

	if (!title || req.body.descriptionInput) {
		return res.render('eestifilmamet_add', {
			notice:'Palun sisesta õiged andmed',
			titleInput: title,
			descriptionInput: description

		});
	}
	try {
		conn = await mysql.createConnection({
			host: process.env.DB_HOST,
			user: process.end.DB_USER,
			password: process.env.DB_PASS,
			database: process.env.DB_NAME
		});
		const sqlReq = 'INSERT INTO profession (title, description) VALUES (?, ?)';
		await conn.execute(sqlReq [
			title, description || null
		]);
		res.render('eestifilmamet_add', {
			notice:'Amet on lisatud',
			titleInput: null,
			descriptionInput: null
		});
	}
	catch (err) {
		console.log('Viga ameti salvestamisel: ' + (err));
		res.render('eestifilmamet_add', {
			notice:'Tekkis viga ameti salvestamisel',
			titleInput: title,
			descriptionInput: description
		});
	}
	finally {
		if (conn) {
			await conn.end();
		}
	}
});

app.listen(5119);