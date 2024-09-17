const searchForm = document.querySelector('.js-search');
const addCountry = document.querySelector('.js-add');
const list = document.querySelector('.js-list');
const formContainer = document.querySelector('.js-form-container');
const markup = '<input type="text" name="country">';
addCountry.addEventListener('click', handlerAddInput);

function handlerAddInput() {
  formContainer.insertAdjacentHTML('beforeend', markup);
}

searchForm.addEventListener('submit', handlerForm);

function handlerForm(evt) {
  evt.preventDefault();
  const data = new FormData(evt.currentTarget);
  const arr = data
    .getAll('country')
    .filter(item => item)
    .map(item => item.trim());
  getCountries(arr)
    .then(async resp => {
      const capitals = resp.map(({ capital }) => capital[0]);
      const weatherService = await getWeather(capitals);
      list.innerHTML = createMarkup(weatherService);
    })
    .catch(e => console.log(e))
    .finally(() => {
      formContainer.innerHTML = markup;
      searchForm.reset();
    });
}

async function getCountries(arr) {
  const resps = arr.map(async item => {
    const resp = await fetch(`https://restcountries.com/v3.1/name/${item}`);
    if (!resp.ok) {
      throw new Error();
    }

    return resp.json();
  });

  const data = await Promise.allSettled(resps);
  const countryObj = data
    .filter(({ status }) => status === 'fulfilled')
    .map(({ value }) => value[0]);

  return countryObj;
}

async function getWeather(arr) {
  const BASE_URL = 'http://api.weatherapi.com/v1';
  const API_KEY = 'b8c62e719a6e4ef6972172816241607';

  const resps = arr.map(async city => {
    const params = new URLSearchParams({
      key: API_KEY,
      q: city,
      lang: 'uk',
    });

    const resp = await fetch(`${BASE_URL}/current.json?${params}`);

    if (!resp.ok) {
      throw new Error(resp.statusText);
    }

    return resp.json();
  });

  const data = await Promise.allSettled(resps);
  const objs = data
    .filter(({ status }) => status === 'fulfilled')
    .map(({ value }) => value);

  return objs;
}

function createMarkup(arr) {
  return arr
    .map(
      ({
        current: {
          temp_c,
          condition: { text, icon },
        },
        location: { country, name },
      }) =>
        `<li>
    <div>
        <h2>${country}</h2>
        <h3>${name}</h3>
    </div>
    <img src="${icon}" alt="${text}">
    <p>${text}</p>
    <p>${temp_c}</p>
</li>`
    )
    .join('');
}
