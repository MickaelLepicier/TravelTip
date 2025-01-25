# 🌍 TravelTip

#### The app that gets you somewhere effortlessly

---

## ✨ Description

**TravelTip** is your companion app for managing favorite locations. Keep track of places you love, explore new spots, and navigate with ease.

---

## 🌟 Main Features

- 📌 **Manage Locations**: Add, update, and organize your favorite spots.
- 🔍 **Search**: Look up addresses and pan the map to any location.
- 🧭 **Geolocation**: Pan the map to your current position with one click.

---

## 🛠️ Locations CRUDL

1. **Create**
   - Click anywhere on the map to add a location (name and rate required).
2. **Read**
   - View detailed information about the selected location.
3. **Update**
   - Edit the location's rating.
4. **Delete**
   - Remove locations you no longer need.
5. **List**
   - Organize locations with **filtering**, **sorting**, and **grouping**.

---

## Selected Location

- Displayed in the header
- Location is active in the list (gold color)
- Marker on the map
- Reflected in query params
- Copy url to clipboard
- Share via Web-Share API

## 🌐 Location Object Format

Here’s the structure of a location object:

```js
{
    id: 'GEouN',
    name: 'Dahab, Egypt',
    rate: 5,
    geo: {
      address: 'Dahab, South Sinai, Egypt',
      lat: 28.5096676,
      lng: 34.5165187,
      zoom: 11
    },
    createdAt: 1706562160181,
    updatedAt: 1706562160181
  }
```

## Services

```js
export const locService = {
  query,
  getById,
  remove,
  save,
  setFilterBy,
  setSortBy,
  getLocCountByRateMap
}

export const mapService = {
  initMap,
  getPosition,
  setMarker,
  panTo,
  lookupAddressGeo,
  addClickListener
}
```

## Controller

```js
// To make things easier in this project structure
// functions that are called from DOM are defined on a global app object

window.app = {
  onRemoveLoc,
  onUpdateLoc,
  onSelectLoc,
  onPanToUserPos,
  onSearchAddress,
  onCopyLoc,
  onShareLoc,
  onSetSortBy,
  onSetFilterBy
}
```

Here is a sample usage:

```html
<button onclick="app.onCopyLoc()">Copy location</button>
<button onclick="app.onShareLoc()">Share location</button>
```
