<template>
  <!-- Backdrop -->
  <div
    class="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
    @click.self="$emit('cancel')"
  >
    <!-- Sheet -->
    <div class="w-full max-w-lg bg-gray-800 rounded-t-3xl shadow-2xl px-5 pt-5 pb-8 animate-slide-up">
      <!-- Handle bar -->
      <div class="mx-auto w-10 h-1 bg-gray-600 rounded-full mb-5"></div>

      <!-- Title -->
      <h2 class="text-xl font-bold text-white mb-1">确认上报轨迹</h2>
      <p class="text-sm text-gray-400 mb-5">请填写本次轨迹的基本信息后提交</p>

      <!-- Track summary card -->
      <div class="bg-gray-700/60 rounded-2xl p-4 mb-5 grid grid-cols-3 gap-3 text-center">
        <div>
          <div class="text-2xl font-bold font-mono text-white">{{ formattedDuration }}</div>
          <div class="text-xs text-gray-400 mt-0.5">采集时长</div>
        </div>
        <div>
          <div class="text-2xl font-bold font-mono text-green-400">{{ formattedDistance }}</div>
          <div class="text-xs text-gray-400 mt-0.5">总距离</div>
        </div>
        <div>
          <div class="text-2xl font-bold font-mono text-blue-300">{{ trackPoints.length }}</div>
          <div class="text-xs text-gray-400 mt-0.5">轨迹点数</div>
        </div>
      </div>

      <!-- Form -->
      <div class="space-y-3">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">轨迹名称 <span class="text-red-400">*</span></label>
          <input
            v-model="trackName"
            type="text"
            placeholder="例：公司到地铁站"
            maxlength="50"
            class="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">备注描述</label>
          <textarea
            v-model="trackDesc"
            placeholder="可选，补充说明（最多 100 字）"
            maxlength="100"
            rows="3"
            class="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base resize-none"
          ></textarea>
        </div>
      </div>

      <!-- Buttons -->
      <div class="flex gap-3 mt-5">
        <button
          @click="$emit('cancel')"
          class="flex-1 bg-gray-700 hover:bg-gray-600 active:bg-gray-800 active:scale-95 rounded-2xl py-4 font-semibold text-gray-200 transition-all"
        >
          取消
        </button>
        <button
          @click="confirm"
          :disabled="!trackName.trim()"
          class="flex-1 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed rounded-2xl py-4 font-bold text-white transition-all shadow-lg shadow-blue-900/40"
        >
          确认上报
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface TrackPoint {
  lat: number
  lng: number
  accuracy: number
  altitude: number | null
  timestamp: number
}

const props = defineProps<{
  trackPoints: TrackPoint[]
  duration: number
  distance: number
}>()

const emit = defineEmits<{
  confirm: [data: { name: string; desc: string }]
  cancel: []
}>()

const trackName = ref(`轨迹 ${new Date().toLocaleDateString('zh-CN')} ${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`)
const trackDesc = ref('')

const formattedDuration = computed(() => {
  const h = Math.floor(props.duration / 3600)
  const m = Math.floor((props.duration % 3600) / 60)
  const s = props.duration % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

const formattedDistance = computed(() => {
  if (props.distance < 1000) return `${Math.round(props.distance)} m`
  return `${(props.distance / 1000).toFixed(2)} km`
})

function confirm() {
  if (!trackName.value.trim()) return
  emit('confirm', { name: trackName.value.trim(), desc: trackDesc.value.trim() })
}
</script>

<style scoped>
@keyframes slide-up {
  from { transform: translateY(100%); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}
.animate-slide-up {
  animation: slide-up 0.28s cubic-bezier(0.32, 0.72, 0, 1) both;
}
</style>
