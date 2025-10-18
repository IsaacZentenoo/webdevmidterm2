const express = require('express');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'views')));

const apiDir = path.join(__dirname, 'starwars-api-master', 'api');

async function readAll() {
	const allPath = path.join(apiDir, 'all.json');
	const data = await fs.readFile(allPath, 'utf8');
	return JSON.parse(data);
}

async function readById(id) {
	const idPath = path.join(apiDir, 'id', `${id}.json`);
	try {
		const data = await fs.readFile(idPath, 'utf8');
		return JSON.parse(data);
	} catch (err) {
		const all = await readAll();
		return all.find((c) => String(c.id) === String(id));
	}
}
app.get('/search', async (req, res, next) => {
	try {
		const q = (req.query.q || '').trim();
		if (!q) return res.redirect('/');
		const all = await readAll();
		const filtered = all.filter(c => c.name && c.name.toLowerCase().includes(q.toLowerCase()));
		const page = Math.max(1, parseInt(req.query.page, 10) || 1);
		const perPage = Math.max(1, Math.min(50, parseInt(req.query.perPage, 10) || 12));
		const total = filtered.length;
		const totalPages = Math.max(1, Math.ceil(total / perPage));
		const start = (page - 1) * perPage;
		const characters = filtered.slice(start, start + perPage);
		res.render('index', { characters, page, perPage, totalPages, total, q });
	} catch (err) {
		next(err);
	}
});
app.get('/', async (req, res, next) => {
    try {
        const all = await readAll();
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const perPage = Math.max(1, Math.min(50, parseInt(req.query.perPage, 10) || 12));
        const total = all.length;
        const totalPages = Math.max(1, Math.ceil(total / perPage));
        const start = (page - 1) * perPage;
        const characters = all.slice(start, start + perPage);
        res.render('index', { characters, page, perPage, totalPages, total });
    } catch (err) {
        console.error('Error in / route:', err);
        res.status(500).send('<pre>' + (err && err.stack ? err.stack : err) + '</pre>');
    }
});
app.get('/characters/:id', async (req, res, next) => {
    try {
        const char = await readById(req.params.id);
        if (!char) return res.status(404).render('error', { message: 'The Force could not locate this character…' });
        res.render('show', { char });
    } catch (err) {
        next(err);
    }
});
app.listen(PORT, () => {
	console.log(`Server listening on http://localhost:${PORT}`);
});
