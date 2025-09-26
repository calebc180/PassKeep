require('dotenv').config();

console.log("Loaded Mongo URI:", process.env.MONGO_URI);

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');

const User = require('./models/User'); // this file must exist!
const PasswordEntry = require('./models/PasswordEntry');

const app = express();
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/test', (req, res) => {
  console.log('TEST route hit:', req.body);
  res.json({ message: 'Test successful' });
});


// serve static files from 'frontend'
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// fallback for root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');

    

    // Routes only defined after DB connection

    // REGISTER route
    app.post('/register', async (req, res) => {
      const { username, password } = req.body;
      try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
          return res.status(400).json({ message: 'Username already taken' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        res.json({ message: 'User registered successfully' });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Registration failed' });
      }
    });

    // LOGIN route
    app.post('/login', async (req, res) => {

      
      console.log('Login body received:', req.body);
      try {
        const { username, password } = req.body;

        const user = await User.findOne({ username: username.trim() });



        if (!user) {
          console.log('User not found for:', username);//log
          return res.status(400).json({ message: 'User not found' });
        }
        console.log('User found:', user);//log

        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Password match:', isMatch);//log

        if (!isMatch) {
          console.log('Invalid password attempt');//log
          return res.status(400).json({ message: 'Invalid password' });
        }
        res.json({ message: 'Login successful' });
      } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Internal server error' });
      }
    });

    // Save passwords route
    app.post('/save-passwords', async (req, res) => {
      const { username, entries } = req.body;
      if (!username || !entries) {
        return res.status(400).json({ message: 'Missing data' });
      }
      try {
        const savedEntries = [];
        for (const entry of entries) {
          if (entry._id) {
            // update existing
            const updated = await PasswordEntry.findOneAndUpdate(
              { _id: entry._id, username },
              { user: entry.user, pass: entry.pass, site: entry.site },
              { new: true }
            );
            if (updated) savedEntries.push(updated);
          } else {
            // create new
            const created = await PasswordEntry.create({
              username,
              user: entry.user,
              pass: entry.pass,
              site: entry.site,
            });
            savedEntries.push(created);
          }
        }
        res.json({ message: 'Passwords saved successfully', savedEntries });
      } catch (error) {
        console.error('Error saving passwords:', error);
        res.status(500).json({ message: 'Error saving passwords' });
      }
    });

    // Update order route
    app.post('/update-order', async (req, res) => {
      const { orderData } = req.body;
      console.log("Received orderData:", orderData);
      if (!Array.isArray(orderData)) {
        return res.status(400).json({ message: 'Invalid request' });
      }
      try {
        const updates = orderData.map(({ id, order }) =>
          PasswordEntry.findByIdAndUpdate(id, { order })
        );
        await Promise.all(updates);
        res.json({ message: 'Order updated successfully' });
      } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ message: 'Server error' });
      }
    });

    // Get passwords route
    app.get('/get-passwords/:username', async (req, res) => {
      const { username } = req.params;
      try {
        const entries = await PasswordEntry.find({ username }).sort({ order: 1 });
        res.json(entries);
      } catch (error) {
        console.error('Error retrieving passwords:', error);
        res.status(500).json({ message: 'Error retrieving passwords' });
      }
    });

    // Delete password route
    app.delete('/delete-password/:id', async (req, res) => {
      const id = req.params.id;
      try {
        const result = await PasswordEntry.deleteOne({ _id: id });
        if (result.deletedCount === 0) {
          return res.status(404).json({ message: "Entry not found." });
        }
        res.json({ message: "Password deleted successfully." });
      } catch (error) {
        console.error("Error deleting password:", error);
        res.status(500).json({ message: "Internal server error." });
      }
    });

    // Update password route
    app.put('/update-password/:id', async (req, res) => {
      const { user, pass, site } = req.body;
      try {
        const updated = await PasswordEntry.findByIdAndUpdate(
          req.params.id,
          { user, pass, site },
          { new: true }
        );
        if (!updated) return res.status(404).json({ message: 'Entry not found' });
        res.json({ message: 'Entry updated successfully', updated });
      } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ message: 'Error updating password' });
      }
    });

    // Test route
    app.get('/test', (req, res) => {
      res.json({ message: 'Server is running!' });
    });

    // Start server AFTER all routes defined
    app.listen(3000, () => console.log('Server running at http://localhost:3000'));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });
