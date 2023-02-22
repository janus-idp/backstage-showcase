const express = require('express');
const app = express();
const router = express.Router();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

router.get('/', function (req, res) {
  res.send('Hello World!');
});

app.use('/', router);

app.listen(process.env.port || 3000);
console.log('Running at port 3000');
