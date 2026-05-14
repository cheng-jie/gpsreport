<template>
  <div class="flex flex-col h-screen bg-gray-900 text-white select-none">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 bg-gray-800 shadow-md z-20">
      <div class="flex items-center gap-2">
        <span class="text-blue-400 text-xl">📍</span>
        <span class="font-bold text-lg tracking-wide">GPS 轨迹采集</span>
      </div>
      <div class="flex items-center gap-2">
        <!-- GPS signal indicator -->
        <div class="flex items-center gap-1 text-sm">
          <span
            class="inline-block w-2 h-2 rounded-full"
            :class="gpsSignalClass"
          ></span>
          <span class="text-gray-300 text-xs">{{ gpsSignalText }}</span>
        </div>
      </div>
    </div>

    <!-- Map Area -->
    <div class="relative flex-1 overflow-hidden">
      <div ref="mapRef" class="w-full h-full"></div>

      <!-- Stats overlay (top-left on map) -->
      <div
        v-if="status !== 'idle'"
        class="absolute top-3 left-3 z-10 bg-gray-900/80 backdrop-blur-sm rounded-xl px-3 py-2 text-sm space-y-1 shadow-lg"
      >
        <div class="flex items-center gap-2">
          <span class="text-gray-400">时长</span>
          <span class="font-mono font-bold text-white">{{ formattedDuration }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-gray-400">距离</span>
          <span class="font-mono font-bold text-green-400">{{ formattedDistance }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-gray-400">点数</span>
          <span class="font-mono font-bold text-blue-300">{{ trackPoints.length }}</span>
        </div>
      </div>

      <!-- Recording badge -->
      <div
        v-if="status === 'recording'"
        class="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-red-600/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold shadow-lg animate-pulse"
      >
        <span class="inline-block w-2 h-2 rounded-full bg-white"></span>
        采集中
      </div>
      <div
        v-if="status === 'paused'"
        class="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-yellow-600/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold shadow-lg"
      >
        <span class="text-white">⏸</span>
        已暂停
      </div>
      <div
        v-if="status === 'stopped'"
        class="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-gray-600/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold shadow-lg"
      >
        <span class="text-white">⏹</span>
        已停止
      </div>

      <!-- Center on location button -->
      <button
        @click="centerMap"
        class="absolute bottom-4 right-4 z-10 bg-gray-800/90 backdrop-blur-sm rounded-full p-3 shadow-lg active:scale-95 transition-transform"
        title="定位到当前位置"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-2.209 0-4 1.791-4 4s1.791 4 4 4 4-1.791 4-4-1.791-4-4-4zm0-6v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      </button>
    </div>

    <!-- Control Panel -->
    <div class="bg-gray-800 px-4 pt-4 pb-6 shadow-2xl z-20">
      <!-- Action buttons -->
      <div class="flex gap-3 justify-center">
        <!-- Start button (idle) -->
        <button
          v-if="status === 'idle'"
          @click="startTracking"
          class="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 active:bg-green-700 active:scale-95 rounded-2xl py-4 font-bold text-lg transition-all shadow-lg shadow-green-900/40"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
          开始采集
        </button>

        <!-- Resume button (paused) -->
        <button
          v-if="status === 'paused'"
          @click="resumeTracking"
          class="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 active:bg-green-700 active:scale-95 rounded-2xl py-4 font-bold text-lg transition-all shadow-lg shadow-green-900/40"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
          继续采集
        </button>

        <!-- Pause button (recording) -->
        <button
          v-if="status === 'recording'"
          @click="pauseTracking"
          class="flex-1 flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-400 active:bg-yellow-600 active:scale-95 rounded-2xl py-4 font-bold text-lg transition-all shadow-lg shadow-yellow-900/40"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
          </svg>
          暂停采集
        </button>

        <!-- Stop button (recording or paused) -->
        <button
          v-if="status === 'recording' || status === 'paused'"
          @click="stopTracking"
          class="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 active:bg-red-700 active:scale-95 rounded-2xl py-4 font-bold text-lg transition-all shadow-lg shadow-red-900/40"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 6h12v12H6z"/>
          </svg>
          停止采集
        </button>

        <!-- Report button (stopped with data) -->
        <button
          v-if="status === 'stopped' && trackPoints.length > 0"
          @click="showReport"
          class="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 active:scale-95 rounded-2xl py-4 font-bold text-lg transition-all shadow-lg shadow-blue-900/40"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          确认上报
        </button>

        <!-- Restart button (stopped) -->
        <button
          v-if="status === 'stopped'"
          @click="resetTracking"
          class="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 active:bg-gray-800 active:scale-95 rounded-2xl px-5 py-4 font-semibold text-lg transition-all shadow-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          重新采集
        </button>
      </div>

      <!-- Error message -->
      <div
        v-if="errorMsg"
        class="mt-3 flex items-start gap-2 bg-red-900/60 border border-red-700 rounded-xl px-3 py-2 text-sm text-red-200"
      >
        <span class="text-red-400 mt-0.5">⚠️</span>
        <span>{{ errorMsg }}</span>
      </div>
    </div>

    <!-- Report Modal -->
    <ReportModal
      v-if="reportVisible"
      :track-points="trackPoints"
      :duration="elapsedSeconds"
      :distance="totalDistance"
      @confirm="handleReportConfirm"
      @cancel="reportVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import ReportModal from './ReportModal.vue'

// ─── Types ────────────────────────────────────────────────────────────────────
interface TrackPoint {
  lat: number
  lng: number
  accuracy: number
  altitude: number | null
  timestamp: number
}

type TrackStatus = 'idle' | 'recording' | 'paused' | 'stopped'

// ─── State ────────────────────────────────────────────────────────────────────
const mapRef = ref<HTMLDivElement | null>(null)
const status = ref<TrackStatus>('idle')
const trackPoints = ref<TrackPoint[]>([])
const totalDistance = ref(0)
const elapsedSeconds = ref(0)
const errorMsg = ref('')
const reportVisible = ref(false)
const hasGps = ref(false)
const currentLat = ref(0)
const currentLng = ref(0)

// ─── Leaflet map objects ───────────────────────────────────────────────────────
let map: L.Map | null = null
let polyline: L.Polyline | null = null
let currentMarker: L.CircleMarker | null = null
let watchId: number | null = null
let timerInterval: ReturnType<typeof setInterval> | null = null
let startTimestamp = 0
let accumulatedSeconds = 0

// ─── Computed ─────────────────────────────────────────────────────────────────
const gpsSignalClass = computed(() => {
  if (!hasGps.value) return 'bg-gray-500'
  return 'bg-green-400 shadow-[0_0_6px_2px_rgba(74,222,128,0.6)]'
})

const gpsSignalText = computed(() => {
  return hasGps.value ? 'GPS 已连接' : '等待 GPS'
})

const formattedDuration = computed(() => {
  const h = Math.floor(elapsedSeconds.value / 3600)
  const m = Math.floor((elapsedSeconds.value % 3600) / 60)
  const s = elapsedSeconds.value % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

const formattedDistance = computed(() => {
  if (totalDistance.value < 1000) return `${Math.round(totalDistance.value)} m`
  return `${(totalDistance.value / 1000).toFixed(2)} km`
})

// ─── Map initialization ───────────────────────────────────────────────────────
onMounted(() => {
  if (!mapRef.value) return

  map = L.map(mapRef.value, {
    zoomControl: false,
    attributionControl: true,
  }).setView([39.9042, 116.4074], 15)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors',
  }).addTo(map)

  L.control.zoom({ position: 'bottomleft' }).addTo(map)

  polyline = L.polyline([], {
    color: '#3b82f6',
    weight: 5,
    opacity: 0.85,
    lineJoin: 'round',
    lineCap: 'round',
  }).addTo(map)

  // Try to get initial position
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        hasGps.value = true
        currentLat.value = pos.coords.latitude
        currentLng.value = pos.coords.longitude
        map?.setView([pos.coords.latitude, pos.coords.longitude], 16)
        updateCurrentMarker(pos.coords.latitude, pos.coords.longitude)
      },
      () => {
        errorMsg.value = '无法获取 GPS 位置，请确认已授权位置权限'
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  } else {
    errorMsg.value = '您的浏览器不支持地理位置服务'
  }
})

onUnmounted(() => {
  stopWatchAndTimer()
  map?.remove()
})

// ─── GPS helpers ──────────────────────────────────────────────────────────────
function updateCurrentMarker(lat: number, lng: number) {
  if (!map) return
  if (!currentMarker) {
    currentMarker = L.circleMarker([lat, lng], {
      radius: 8,
      color: '#fff',
      weight: 3,
      fillColor: '#3b82f6',
      fillOpacity: 1,
    }).addTo(map)
  } else {
    currentMarker.setLatLng([lat, lng])
  }
}

function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function onGpsSuccess(pos: GeolocationPosition) {
  const { latitude, longitude, accuracy, altitude } = pos.coords
  hasGps.value = true
  currentLat.value = latitude
  currentLng.value = longitude
  updateCurrentMarker(latitude, longitude)

  if (status.value !== 'recording') return

  if (trackPoints.value.length > 0) {
    const last = trackPoints.value[trackPoints.value.length - 1]
    const dist = calcDistance(last.lat, last.lng, latitude, longitude)
    // Filter jitter: only add point if moved > 3 meters
    if (dist < 3) return
    totalDistance.value += dist
  }

  trackPoints.value.push({
    lat: latitude,
    lng: longitude,
    accuracy,
    altitude,
    timestamp: pos.timestamp,
  })

  polyline?.setLatLngs(trackPoints.value.map((p) => [p.lat, p.lng]))
  map?.panTo([latitude, longitude])
}

function onGpsError(err: GeolocationPositionError) {
  hasGps.value = false
  if (err.code === GeolocationPositionError.PERMISSION_DENIED) {
    errorMsg.value = 'GPS 权限被拒绝，请在浏览器设置中授权位置访问'
    stopTracking()
  } else if (err.code === GeolocationPositionError.TIMEOUT) {
    errorMsg.value = 'GPS 信号超时，请确保设备 GPS 已开启并处于室外'
  } else {
    errorMsg.value = `GPS 错误: ${err.message}`
  }
}

function stopWatchAndTimer() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId)
    watchId = null
  }
  if (timerInterval !== null) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

// ─── Track controls ───────────────────────────────────────────────────────────
function startTracking() {
  if (!navigator.geolocation) {
    errorMsg.value = '您的浏览器不支持地理位置服务'
    return
  }
  errorMsg.value = ''
  status.value = 'recording'
  startTimestamp = Date.now()

  watchId = navigator.geolocation.watchPosition(onGpsSuccess, onGpsError, {
    enableHighAccuracy: true,
    maximumAge: 1000,
    timeout: 15000,
  })

  timerInterval = setInterval(() => {
    elapsedSeconds.value = accumulatedSeconds + Math.floor((Date.now() - startTimestamp) / 1000)
  }, 1000)
}

function pauseTracking() {
  status.value = 'paused'
  accumulatedSeconds = elapsedSeconds.value
  stopWatchAndTimer()
}

function resumeTracking() {
  errorMsg.value = ''
  status.value = 'recording'
  startTimestamp = Date.now()

  watchId = navigator.geolocation.watchPosition(onGpsSuccess, onGpsError, {
    enableHighAccuracy: true,
    maximumAge: 1000,
    timeout: 15000,
  })

  timerInterval = setInterval(() => {
    elapsedSeconds.value = accumulatedSeconds + Math.floor((Date.now() - startTimestamp) / 1000)
  }, 1000)
}

function stopTracking() {
  accumulatedSeconds = elapsedSeconds.value
  stopWatchAndTimer()
  status.value = 'stopped'
}

function resetTracking() {
  stopWatchAndTimer()
  status.value = 'idle'
  trackPoints.value = []
  totalDistance.value = 0
  elapsedSeconds.value = 0
  accumulatedSeconds = 0
  errorMsg.value = ''
  polyline?.setLatLngs([])
}

function centerMap() {
  if (currentLat.value && currentLng.value) {
    map?.setView([currentLat.value, currentLng.value], map.getZoom())
  }
}

function showReport() {
  reportVisible.value = true
}

function handleReportConfirm(data: { name: string; desc: string }) {
  reportVisible.value = false
  // Simulate sending the report (replace with real API call)
  console.log('上报数据:', {
    name: data.name,
    desc: data.desc,
    points: trackPoints.value,
    distance: totalDistance.value,
    duration: elapsedSeconds.value,
    startTime: trackPoints.value[0]?.timestamp,
    endTime: trackPoints.value[trackPoints.value.length - 1]?.timestamp,
  })
  // Show success feedback then reset
  errorMsg.value = ''
  alert(`轨迹"${data.name}"上报成功！共 ${trackPoints.value.length} 个轨迹点，${formattedDistance.value}`)
  resetTracking()
}
</script>
