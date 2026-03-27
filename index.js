require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

const API_KEY = process.env.OPENWEATHER_API_KEY;

// Read orders from orders.json
const orders = JSON.parse(fs.readFileSync('orders.json', 'utf8'));

// --- WEATHER-AWARE APOLOGY FUNCTION ---
function generateApology(customerName, city, weatherDesc) {
  return `Hi ${customerName}, your order to ${city} is delayed due to ${weatherDesc}. We appreciate your patience!`;
}

// --- FETCH WEATHER FOR ONE CITY ---
async function getWeather(city) {
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;

    const res = await axios.get(url);

    return {
      main: res.data.weather[0].main,
      description: res.data.weather[0].description
    };

  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message);
    } else {
      throw new Error('Network error');
    }
  }
}

// --- PROCESS ONE ORDER ---
async function processOrder(order) {
  try {
    const weather = await getWeather(order.city);
    const badWeather = ['Rain', 'Snow', 'Extreme'];

    if (badWeather.includes(weather.main)) {
      order.status = 'Delayed';

      const msg = generateApology(order.customer, order.city, weather.description);
      console.log('DELAYED:', msg);

    } else {
      console.log(`OK: ${order.customer} in ${order.city} — ${weather.main}`);
    }

  } catch (err) {
    console.error(`ERROR for order ${order.order_id}: ${err.message}`);
    order.status = 'Error';
  }

  return order;
}

// --- MAIN: RUN ALL ORDERS IN PARALLEL ---
async function main() {
  console.log('Checking weather for all orders...\n');

  const updatedOrders = await Promise.all(orders.map(processOrder));

  fs.writeFileSync('updated_orders.json', JSON.stringify(updatedOrders, null, 2));

  console.log('\nDone! updated_orders.json has been created.');
}

main();