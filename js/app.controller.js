import { utilService } from './services/util.service.js'
import { locService } from './services/loc.service.js'
import { mapService } from './services/map.service.js'

window.onload = onInit

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
  onSetFilterBy,
  onSaveLoc
}

function onInit() {
  getFilterByFromQueryParams()
  loadAndRenderLocs()
  mapService
    .initMap()
    .then(() => {
      // onPanToTokyo()
      mapService.addClickListener(onAddLoc)
    })
    .catch((err) => {
      console.error('OOPs:', err)
      flashMsg('Cannot init map')
    })
}

function renderLocs(locs) {
  const selectedLocId = getLocIdFromQueryParams()

  var strHTML = locs
    .map((loc) => {
      const className = loc.id === selectedLocId ? 'active' : ''
      var distanceHTML = ''
      const userPos = mapService.getUserPos()
      if (userPos) {
        const distance = utilService.getDistance(userPos, loc.geo)
        distanceHTML = `<span class="smaller">Distance: ${distance} KM.</span>`
      }
      return `
      <li class="loc ${className}" data-id="${loc.id}">
          <h4>  
              <span>${loc.name}</span>
              ${distanceHTML}
              <span title="${loc.rate} stars">${'★'.repeat(loc.rate)}</span>
          </h4>
          <p class="muted">
              Created: ${utilService.elapsedTime(loc.createdAt)}
              ${
                loc.createdAt !== loc.updatedAt
                  ? ` | Updated: ${utilService.elapsedTime(loc.updatedAt)}`
                  : ''
              }
          </p>
          <div class="loc-btns">     
             <button title="Delete" onclick="app.onRemoveLoc('${
               loc.id
             }')">🗑️</button>
             <button title="Edit" onclick="app.onUpdateLoc('${
               loc.id
             }')">✏️</button>
             <button title="Select" onclick="app.onSelectLoc('${
               loc.id
             }')">🗺️</button>
          </div>     
      </li>`
    })
    .join('')

  const elLocList = document.querySelector('.loc-list')
  elLocList.innerHTML = strHTML || 'No locs to show'

  renderLocStats()
  if (selectedLocId) {
    const selectedLoc = locs.find((loc) => loc.id === selectedLocId)
    if (selectedLoc) displayLoc(selectedLoc)
    else unDisplayLoc()
  }
  document.querySelector('.debug').innerText = JSON.stringify(locs, null, 2)
}

function onRemoveLoc(locId) {
  const isConfirm = confirm('Are you sure you want to delete?')
  if (!isConfirm) return
  locService
    .remove(locId)
    .then(() => {
      flashMsg('Location removed')
      unDisplayLoc()
      loadAndRenderLocs()
    })
    .catch((err) => {
      console.error('OOPs:', err)
      flashMsg('Cannot remove location')
    })
}

function onSearchAddress(ev) {
  ev.preventDefault()
  const el = document.querySelector('[name=address]')
  mapService
    .lookupAddressGeo(el.value)
    .then((geo) => {
      mapService.panTo(geo)
    })
    .catch((err) => {
      console.error('OOPs:', err)
      flashMsg('Cannot lookup address')
    })
}

function onAddLoc(geo) {
  const elDialog = document.querySelector('dialog.loc-edit')
  elDialog.dataset.geo = JSON.stringify(geo)
  elDialog.querySelector('input[name=name]').value = geo.address
  elDialog.querySelector('input[name=id]').value = ''
  elDialog.showModal()
}

function loadAndRenderLocs() {
  locService
    .query()
    .then(renderLocs)
    .catch((err) => {
      console.error('OOPs:', err)
      flashMsg('Cannot load locations')
    })
}

function onPanToUserPos() {
  mapService
    .fetchUserPosition()
    .then((latLng) => {
      unDisplayLoc()
      mapService.panTo({ ...latLng, zoom: 15 })
      // gUserPos = latLng
      mapService.setUserPos(latLng)
      loadAndRenderLocs()
      flashMsg(`You are at Latitude: ${latLng.lat} Longitude: ${latLng.lng}`)
    })
    .catch((err) => {
      console.error('OOPs:', err)
      flashMsg('Cannot get your position')
    })
}

function onUpdateLoc(locId) {
  locService.getById(locId).then((loc) => {
    // console.log('loc:', loc)
    const elDialog = document.querySelector('dialog.loc-edit')
    const elInputId = elDialog.querySelector('input[name=id]')
    const elInputName = elDialog.querySelector('input[name=name]')
    const elInputRate = elDialog.querySelector('input[name=rate]')

    elInputId.value = loc.id
    elInputName.value = loc.name
    elInputRate.value = loc.rate

    elDialog.showModal()
  })
}

function onSelectLoc(locId) {
  return locService
    .getById(locId)
    .then(displayLoc)
    .catch((err) => {
      console.error('OOPs:', err)
      flashMsg('Cannot display this location')
    })
}

function onSaveLoc(ev) {
  // console.log('ev:', ev)
  ev.preventDefault()
  const elDialog = document.querySelector('dialog.loc-edit')
  const elInputId = elDialog.querySelector('input[name=id]')
  const elInputName = elDialog.querySelector('input[name=name]')
  const elInputRate = elDialog.querySelector('input[name=rate]')
  if (!elInputName.value || !elInputRate.value) return flashMsg('Missing info')

  const loc = {
    id: elInputId.value,
    name: elInputName.value,
    rate: +elInputRate.value
  }

  if (!loc.id) loc.geo = JSON.parse(elDialog.dataset.geo)

  locService
    .save(loc)
    .then((savedLoc) => {
      elDialog.close()
      flashMsg(`Location saved`)
      utilService.updateQueryParams({ locId: savedLoc.id })
      loadAndRenderLocs()
    })
    .catch((err) => {
      console.error('OOPs:', err)
      flashMsg('Cannot add location')
    })
}

function displayLoc(loc) {
  document.querySelector('.loc.active')?.classList?.remove('active')
  document.querySelector(`.loc[data-id="${loc.id}"]`).classList.add('active')

  mapService.panTo(loc.geo)
  mapService.setMarker(loc)

  const el = document.querySelector('.selected-loc')
  el.querySelector('.loc-name').innerText = loc.name
  el.querySelector('.loc-address').innerText = loc.geo.address
  el.querySelector('.loc-rate').innerHTML = '★'.repeat(loc.rate)
  const userPos = mapService.getUserPos()
  if (userPos) {
    const distance = utilService.getDistance(userPos, loc.geo)
    el.querySelector('h3').innerText = `Distance: ${distance} KM.`
  }
  el.classList.add('show')
  utilService.updateQueryParams({ locId: loc.id })
  el.querySelector('[name=loc-copier]').value = window.location
}

function unDisplayLoc() {
  utilService.updateQueryParams({ locId: '' })
  document.querySelector('.selected-loc').classList.remove('show')
  mapService.setMarker(null)
}

function onCopyLoc() {
  const elCopy = document.querySelector('[name=loc-copier]')
  elCopy.select()
  elCopy.setSelectionRange(0, 99999) // For mobile devices
  navigator.clipboard.writeText(elCopy.value)
  flashMsg('Link copied, ready to paste')
}

function onShareLoc() {
  const url = document.querySelector('[name=loc-copier]').value

  // title and text not respected by any app (e.g. whatsapp)
  const data = {
    title: 'Cool location',
    text: 'Check out this location',
    url
  }
  navigator.share(data)
}

function flashMsg(msg) {
  const el = document.querySelector('.user-msg')
  el.innerText = msg
  el.classList.add('open')
  setTimeout(() => {
    el.classList.remove('open')
  }, 3000)
}

function getFilterByFromQueryParams() {
  const queryParams = new URLSearchParams(window.location.search)
  const txt = queryParams.get('txt') || ''
  const minRate = queryParams.get('minRate') || 0
  locService.setFilterBy({ txt, minRate })

  document.querySelector('input[name="filter-by-txt"]').value = txt
  document.querySelector('input[name="filter-by-rate"]').value = minRate
}

function getLocIdFromQueryParams() {
  const queryParams = new URLSearchParams(window.location.search)
  const locId = queryParams.get('locId')
  return locId
}

function onSetSortBy() {
  const prop = document.querySelector('.sort-by').value
  const isDesc = document.querySelector('.sort-desc').checked

  if (!prop) return

  const sortBy = {}
  sortBy[prop] = isDesc ? -1 : 1

  // Shorter Syntax:
  // const sortBy = {
  //     [prop] : (isDesc)? -1 : 1
  // }

  locService.setSortBy(sortBy)
  loadAndRenderLocs()
}

function onSetFilterBy({ txt, minRate }) {
  const filterBy = locService.setFilterBy({ txt, minRate: +minRate })
  utilService.updateQueryParams(filterBy)
  loadAndRenderLocs()
}

function renderLocStats() {
  locService.getLocCountByRateMap().then((stats) => {
    handleStats(stats, 'loc-stats-rate')
  })

  locService.getLocCountByUpdatedMap().then((stats) => {
    handleStats(stats, 'loc-stats-updated')
  })
}

function handleStats(stats, selector) {
  // stats = { low: 37, medium: 11, high: 100, total: 148 }
  // stats = { low: 5, medium: 5, high: 5, baba: 55, mama: 30, total: 100 }
  const labels = cleanStats(stats)
  const colors = utilService.getColors()

  var sumPercent = 0
  var colorsStr = `${colors[0]} ${0}%, `
  labels.forEach((label, idx) => {
    if (idx === labels.length - 1) return
    const count = stats[label]
    const percent = Math.round((count / stats.total) * 100, 2)
    sumPercent += percent
    colorsStr += `${colors[idx]} ${sumPercent}%, `
    if (idx < labels.length - 1) {
      colorsStr += `${colors[idx + 1]} ${sumPercent}%, `
    }
  })

  colorsStr += `${colors[labels.length - 1]} ${100}%`
  // Example:
  // colorsStr = `purple 0%, purple 33%, blue 33%, blue 67%, red 67%, red 100%`

  const elPie = document.querySelector(`.${selector} .pie`)
  const style = `background-image: conic-gradient(${colorsStr})`
  elPie.style = style

  const ledendHTML = labels
    .map((label, idx) => {
      return `
                <li>
                    <span class="pie-label" style="background-color:${colors[idx]}"></span>
                    ${label} (${stats[label]})
                </li>
            `
    })
    .join('')

  const elLegend = document.querySelector(`.${selector} .legend`)
  elLegend.innerHTML = ledendHTML
}

function cleanStats(stats) {
  const cleanedStats = Object.keys(stats).reduce((acc, label) => {
    if (label !== 'total' && stats[label]) {
      acc.push(label)
    }
    return acc
  }, [])
  return cleanedStats
}
