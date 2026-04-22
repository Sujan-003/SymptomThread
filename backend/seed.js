const axios = require('axios');

const seed = async () => {
  console.log('Triggering seed endpoint...');
  try {
    const res = await axios.post('http://localhost:5000/api/seed');
    console.log('Success:', res.data.message);
  } catch (error) {
    console.error('Error seeding data:', error.response ? error.response.data : error.message);
  }
};

seed();
