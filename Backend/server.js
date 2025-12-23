const dotenv = require('dotenv');
dotenv.config();
const connectDB = require('./src/DB/Db');
const app = require('./src/index');
const port = process.env.PORT || 3000;


// Connect to MongoDB
connectDB();

app.get('/', (req, res) => {
  res.send('Hii, Your app is running');
});


// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


