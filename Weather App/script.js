const userTab = document.querySelector("[data-userWeather]");
const searchTab = document.querySelector("[data-searchWeather]");
const userContainer = document.querySelector(".weather-container");
const grantAccessContainer = document.querySelector(".grant-location-container");
const searchForm = document.querySelector("[data-searchForm]");
const loadingScreen = document.querySelector(".loading-container");
const userInfoContainer = document.querySelector(".user-info-container");
const forecastContainer = document.querySelector("[data-forecastContainer]");
const searchInput = document.querySelector("[data-searchInput]");
const searchDate = document.querySelector("[data-searchDate]");
 
// initailly vairables need
let oldTab = userTab;
 const API_KEY = "1c2b09a465ec92c6bfe90fb523904fcb";
oldTab.classList.add("current-tab");

const today = new Date();
const minDate = today.toISOString().split("T")[0];
const maxDate = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
if (searchDate) {
  searchDate.min = minDate;
  searchDate.max = maxDate;
}

getfromSessionStorage();
function switchTab(newTab){
    if(newTab != oldTab){ 
        oldTab.classList.remove("current-tab");
        oldTab=newTab;
        oldTab.classList.add("current-tab");

        // yaha add karo
        searchInput.value = "";
        searchDate.value = "";

        if(!searchForm.classList.contains("active")){
            userInfoContainer.classList.remove("active");
            grantAccessContainer.classList.remove("active");
            searchForm.classList.add("active");
        }
        else{
            searchForm.classList.remove("active");
            userInfoContainer.classList.remove("active");
            getfromSessionStorage();
        }
    }
}

userTab.addEventListener("click", () => {
    switchTab(userTab);
});

searchTab.addEventListener("click", () => {
    switchTab(searchTab);
});

function getfromSessionStorage(){
    const localCoordinates = sessionStorage.getItem("user-coordinates");
    if(!localCoordinates){
        grantAccessContainer.classList.add("active");
    }
    else{
        const coordinates = JSON.parse(localCoordinates);
        fetchUserWeatherInfo(coordinates);
    }
}

async function fetchUserWeatherInfo(coordinates){
    const {lat, lon} = coordinates;
    // make grantcontainer invisible
    grantAccessContainer.classList.remove("active");
    // make loader visible
    loadingScreen.classList.add("active");

    //API Call
    try{
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
        const data = await response.json();
        loadingScreen.classList.remove("active");
        userInfoContainer.classList.add("active");
        renderWeatherInfo(data);
    }
    catch(err){   
       loadingScreen.classList.remove("active");
    }
} 

function renderWeatherInfo(weatherInfo, selectedDate){
    //fistly, we have to fetch the elements

    const cityName = document.querySelector("[data-cityName]");
    const countryIcon= document.querySelector("[data-countryIcon]");
    const desc = document.querySelector("[data-weatherDesc]")
    const weatherIcon = document.querySelector("[data-weatherIcon]");
    const temp = document.querySelector("[data-temp]");
    const windspeed = document.querySelector("[data-windspeed]");
    const humidity = document.querySelector("[data-humidity]");
    const cloudiness = document.querySelector("[data-cloudiness]");
    const weatherDate = document.querySelector("[data-weatherDate]");

    //fetch values from weather Info object and put it UI elements
cityName.innerText = weatherInfo?.name;
countryIcon.src = `https://flagcdn.com/144x108/${weatherInfo?.sys?.country.toLowerCase()}.png`; 
desc.innerText = weatherInfo?.weather?.[0]?.description;
weatherIcon.src=`http://openweathermap.org/img/w/${weatherInfo?.weather?.[0]?.icon}.png`;
temp.innerText = `${weatherInfo?.main?.temp} °C`; 
windspeed.innerText = `${weatherInfo?.wind?.speed}m/s`;
humidity.innerText = `${weatherInfo?.main?.humidity}%`;
cloudiness.innerText = `${weatherInfo?.clouds?.all}%`;

    if (selectedDate || weatherInfo?.dt_txt) {
      const dateText = selectedDate || weatherInfo.dt_txt.split(" ")[0];
      weatherDate.innerText = `Date: ${dateText}`;
      weatherDate.style.display = "block";
    } else {
      weatherDate.innerText = "";
      weatherDate.style.display = "none";
    }
    if (!selectedDate) {
      clearForecastItems();
    }
}


function getLocation(){
    if(navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition);
    }
    else {
   // show an alert for no gelelocation support available
    }
}  
    function showPosition(position){
    const userCoordinates = {
    lat: position.coords.latitude,
    lon: position.coords.longitude,
    }
    sessionStorage.setItem("user-coordinates", JSON.stringify(userCoordinates));
     fetchUserWeatherInfo(userCoordinates);
    } 
    
    const grantAccessButton = document.querySelector("[data-grantAccess]"); 
    grantAccessButton.addEventListener("click", getLocation);

    searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const cityName = searchInput.value.trim();
    const dateValue = searchDate?.value;

    if (!cityName) return;
    fetchSearchWeatherInfo(cityName, dateValue);
    })

    async function fetchSearchWeatherInfo(city, dateValue) {
       loadingScreen.classList.add("active");
       userInfoContainer.classList.remove("active"); 
       grantAccessContainer.classList.remove("active");

      try {
          const response = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`
          );

          if (!response.ok) throw new Error("City not found");
          const data = await response.json();

          if (!dateValue) {
            dateValue = data.list[0].dt_txt.split(" ")[0];
          }

          const forecastItems = data.list.filter((item) => item.dt_txt.startsWith(dateValue));

          if (forecastItems.length === 0) {
            loadingScreen.classList.remove("active");
            alert(`No forecast available for ${dateValue}. Please choose a date within the next 5 days.`);
            return;
          }

          loadingScreen.classList.remove("active");
          userInfoContainer.classList.add("active");
          renderForecastForDate(data.city, forecastItems, dateValue);
        }
      catch(err) {
        loadingScreen.classList.remove("active");
        alert("Unable to fetch weather. " + err.message);
      }
    }

    function renderForecastForDate(city, forecastItems, selectedDate) {
      clearForecastItems();
      forecastContainer.classList.add("active");
      userInfoContainer.classList.add("active");

      const first = forecastItems[0];
      renderWeatherInfo({
        name: city.name,
        sys: { country: city.country },
        weather: [first.weather[0]],
        main: { temp: first.main.temp, humidity: first.main.humidity },
        wind: { speed: first.wind.speed },
        clouds: { all: first.clouds.all },
        dt_txt: first.dt_txt,
      }, selectedDate);

      const cards = forecastItems
        .map((item) => {
          const time = item.dt_txt.split(" ")[1].slice(0, 5);
          return `
            <div class="forecast-card">
              <p class="forecast-time">${time}</p>
              <p class="forecast-temp">${item.main.temp.toFixed(1)} °C</p>
            </div>
          `;
        })
        .join("");

      forecastContainer.innerHTML = cards;
    }

    function clearForecastItems() {
      if (forecastContainer) {
        forecastContainer.innerHTML = "";
        forecastContainer.classList.remove("active");
      }
    }

    function getForecastForDate(list, dateValue) {
      const dateItems = list.filter((item) => item.dt_txt.startsWith(dateValue));
      if (dateItems.length === 0) return null;
      return dateItems.find((item) => item.dt_txt.endsWith("12:00:00")) || dateItems[0];
    }