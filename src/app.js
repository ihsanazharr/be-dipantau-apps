const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes/indexRoutes');

const app = express();

app.use(helmet());
app.use(cors()); 
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request body

app.use(routes);

app.use(errorHandler);

app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.statusCode = 404;
  next(error);
});

module.exports = app;