/**
 * Canvas 像素块溶解动画
 * @param {string} fromUrl - 当前背景图 URL
 * @param {string} toUrl - 目标背景图 URL
 * @param {Object} [opts]
 * @param {number} [opts.blockSize=8] - 像素块大小
 * @param {number} [opts.duration=600] - 动画时长(ms)
 * @returns {Promise<void>}
 */
export function pixelDissolve(fromUrl, toUrl, { blockSize = 8, duration = 600 } = {}) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    canvas.style.cssText = 'position:fixed;inset:0;z-index:5;pointer-events:none;image-rendering:pixelated'
    const ctx = canvas.getContext('2d')
    document.body.appendChild(canvas)

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    let loaded = 0
    let failed = false
    const fromImg = new Image()
    const toImg = new Image()
    const done = () => { if (++loaded < 2 && !failed) return; animate() }
    const fail = () => { failed = true; canvas.remove(); resolve() }

    fromImg.onload = toImg.onload = done
    fromImg.onerror = toImg.onerror = fail

    fromImg.src = fromUrl
    toImg.src = toUrl

    function animate() {
      // 绘制旧图 → 读取像素
      ctx.drawImage(fromImg, 0, 0, canvas.width, canvas.height)
      const fromData = ctx.getImageData(0, 0, canvas.width, canvas.height)

      // 绘制新图 → 读取像素
      ctx.drawImage(toImg, 0, 0, canvas.width, canvas.height)
      const toData = ctx.getImageData(0, 0, canvas.width, canvas.height)

      // 恢复旧图（动画起点）
      ctx.putImageData(fromData, 0, 0)

      // 计算像素块网格
      const cols = Math.ceil(canvas.width / blockSize)
      const rows = Math.ceil(canvas.height / blockSize)
      const total = cols * rows

      // 随机排列块索引
      const order = Array.from({ length: total }, (_, i) => i)
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[order[i], order[j]] = [order[j], order[i]]
      }

      // 预计算：每块包含的像素在 ImageData 中的起始索引
      const blockPixels = order.map(idx => {
        const col = idx % cols
        const row = Math.floor(idx / cols)
        const x0 = col * blockSize
        const y0 = row * blockSize
        const x1 = Math.min(x0 + blockSize, canvas.width)
        const y1 = Math.min(y0 + blockSize, canvas.height)
        const pixels = []
        for (let y = y0; y < y1; y++) {
          const rowStart = (y * canvas.width + x0) * 4
          for (let x = x0; x < x1; x++) {
            pixels.push(rowStart + (x - x0) * 4)
          }
        }
        return pixels
      })

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      const toArray = toData.data
      let revealed = 0
      const start = performance.now()

      function frame(now) {
        const progress = Math.min((now - start) / duration, 1)
        const target = Math.floor(progress * total)

        // 逐块将新图像素写入当前帧
        for (let b = revealed; b < target; b++) {
          for (const idx of blockPixels[b]) {
            data[idx]     = toArray[idx]
            data[idx + 1] = toArray[idx + 1]
            data[idx + 2] = toArray[idx + 2]
            data[idx + 3] = toArray[idx + 3]
          }
        }
        revealed = target

        ctx.putImageData(imageData, 0, 0)

        if (progress < 1) {
          requestAnimationFrame(frame)
        } else {
          canvas.remove()
          resolve()
        }
      }

      requestAnimationFrame(frame)
    }
  })
}
