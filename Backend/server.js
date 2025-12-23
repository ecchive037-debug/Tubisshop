const dotenv = require('dotenv');
dotenv.config();
const app = require('./src/index');
const port = process.env.PORT;

const connectDB = require('./src/DB/Db');

app.get('/', (req, res) => {
        res.send(`Hii, Your app is running`);
})

connectDB()
    .then(() => {
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    })
    .catch((err) => {
        console.error('Failed to connect to MongoDB — exiting', err);
        process.exit(1);
    });


