import styled from 'styled-components/macro'
import tw from 'twin.macro'

import React, { useEffect, useRef } from 'react'
import * as THREE from 'assets/three.module'

const DepositInfoGraphic = () => {
  const containerRef = useRef(null)
  useEffect(() => {
    let camera
    let scene
    let renderer
    let mesh
    let renderId
    const width = 65
    const height = 65

    const init = () => {
      camera = new THREE.PerspectiveCamera(55, width / height, 1, 1000)
      camera.position.z = 400

      scene = new THREE.Scene()

      const activeMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,
        wireframe: true,
        opacity: 1.0,
      })

      const geometry = new THREE.BoxBufferGeometry(200, 200, 200)
      mesh = new THREE.Mesh(geometry, activeMaterial)
      scene.add(mesh)

      renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setPixelRatio(window.devicePixelRatio)
      renderer.setSize(width, height)
      renderer.setClearColor(0xffffff, 1)

      camera.aspect = width / height
      camera.updateProjectionMatrix()

      if (containerRef.current) {
        containerRef.current.appendChild(renderer.domElement)
      }
    }

    const animate = () => {
      renderId = requestAnimationFrame(animate)
      mesh.rotation.x += 0.0025
      mesh.rotation.y += 0.005
      renderer.render(scene, camera)
    }

    const cleanup = () => {
      if (scene) {
        while (scene.children.length > 0) {
          scene.remove(scene.children[0])
        }
      }
      if (renderer) {
        renderer.dispose()
      }
      cancelAnimationFrame(renderId)
      if (containerRef.current && containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild)
      }
    }

    try {
      init()
      animate()
    } catch (e) {
      console.error('Unable to render graphic')
    }
    return cleanup
  }, [])

  return (
    <DepositInfoGraphicContainer id="depositInfoGraphic" ref={containerRef} style={{ width: '65px', height: '65px' }} />
  )
}

const DepositInfoGraphicContainer = styled.div`
  ${tw`w-65px h-65px ml-4 mr-4 my-6`};
`

export default DepositInfoGraphic
