const DEFAULT_MAX_INPUT = 2.5 * 1024 * 1024 // 2.5 MB before resize

/**
 * Resize image to fit inside maxSide (keeps aspect ratio), output JPEG data URL.
 * @param {File} file
 * @param {{ maxSide?: number, maxInputBytes?: number, quality?: number }} options
 * @returns {Promise<string>}
 */
export function processImageFile(file, options = {}) {
  const maxSide = options.maxSide ?? 240
  const maxInputBytes = options.maxInputBytes ?? DEFAULT_MAX_INPUT
  const quality = options.quality ?? 0.82

  return new Promise((resolve, reject) => {
    if (!file || !file.size) {
      reject(new Error('No image file selected.'))
      return
    }
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please choose an image file (PNG, JPG, etc.).'))
      return
    }
    if (file.size > maxInputBytes) {
      reject(new Error(`Image is too large (max ${Math.round(maxInputBytes / (1024 * 1024))} MB).`))
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result
      if (typeof dataUrl !== 'string') {
        reject(new Error('Could not read the image.'))
        return
      }

      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        const scale = Math.min(1, maxSide / Math.max(width, height))
        width = Math.max(1, Math.round(width * scale))
        height = Math.max(1, Math.round(height * scale))

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Could not process the image.'))
          return
        }
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = () => reject(new Error('Invalid or corrupted image.'))
      img.src = dataUrl
    }
    reader.onerror = () => reject(new Error('Could not read the file.'))
    reader.readAsDataURL(file)
  })
}
