import { useEffect, useMemo, useState } from 'react'
import { useLocation, useSearch } from 'wouter'

function readCompareId(search) {
  return new URLSearchParams(search || '').get('compare') || ''
}

/**
 * Manages the shareable article comparison state. Revision bodies are fetched
 * only after a historical version is selected.
 * @param {Object|null} meta Current article metadata.
 * @param {string} slug Current article slug.
 * @returns {{ revisions: Object[], compareId: string, comparison: Object|null, status: string, selectRevision: Function, retry: Function }}
 */
export default function useArticleRevisions(meta, slug) {
  const [location, navigate] = useLocation()
  const search = useSearch()
  const compareId = readCompareId(search)
  const revisions = meta?.revisionHistory?.revisions || []
  const selected = useMemo(() => revisions.find(item => item.id === compareId) || null, [revisions, compareId])
  const [state, setState] = useState({ status: 'latest', comparison: null })

  const load = () => {
    if (!compareId) {
      setState({ status: 'latest', comparison: null })
      return undefined
    }
    if (!selected) {
      setState({ status: 'error', comparison: null, message: '该历史版本暂不可用' })
      return undefined
    }

    const controller = new AbortController()
    setState({ status: 'loading', comparison: null })
    fetch(selected.comparisonUrl, { signal: controller.signal, credentials: 'same-origin' })
      .then(response => {
        if (!response.ok) throw new Error(`revision request failed: ${response.status}`)
        return response.json()
      })
      .then(payload => {
        const valid = payload?.schemaVersion === meta.revisionHistory.schemaVersion &&
          payload.slug === slug &&
          payload.generation === meta.revisionHistory.generation &&
          payload.from?.id === selected.id &&
          payload.to?.bodyHash === meta.revisionHistory.currentBodyHash
        if (!valid) throw new Error('revision payload does not match the current article')
        setState({ status: 'ready', comparison: payload })
      })
      .catch(error => {
        if (error.name !== 'AbortError') {
          setState({ status: 'error', comparison: null, message: '历史版本加载失败，请重试' })
        }
      })

    return () => controller.abort()
  }

  useEffect(() => load(), [slug, compareId, selected?.comparisonUrl, meta?.revisionHistory?.generation])

  const selectRevision = id => {
    const params = new URLSearchParams(search || '')
    if (id) params.set('compare', id)
    else params.delete('compare')
    const query = params.toString()
    const hash = typeof window !== 'undefined' ? window.location.hash : ''
    navigate(`${location.split('?')[0]}${query ? `?${query}` : ''}${hash}`)
  }

  return {
    revisions,
    compareId,
    comparison: state.comparison,
    status: state.status,
    message: state.message,
    selectRevision,
    retry: load,
  }
}
