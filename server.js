const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('MESIN JOY CORP NYALA!'));
app.listen(process.env.PORT || 3000, () => console.log('Server Jalan'));
