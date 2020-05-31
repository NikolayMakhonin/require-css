/* eslint-disable no-unused-vars */
/* global self, caches, fetch */
// @ts-ignore
import {files, shell, timestamp} from 'SAPPER_MODULE/service-worker'
import {logger} from '@flemist/web-logger'
import './initWebrain'
import './initClientLog'

const init = () => {
	const catchLog = promise => {
		if (promise instanceof Promise) {
			return promise.catch(err => {
				logger.error(err)
				throw err
			})
		}
		return promise
	}

	const ASSETS = `cache${timestamp}`

	// `shell` is an array of all the files generated by the bundler,
	// `files` is an array of everything in the `static` directory
	const to_cache = shell.concat(files)
	const cached = new Set(to_cache)

	self.addEventListener('install', event => {
		event.waitUntil(catchLog(caches
			.open(ASSETS)
			.then(cache => cache.addAll(to_cache))
			.then(() => {
				self.skipWaiting()
			})))
	})

	self.addEventListener('activate', event => {
		event.waitUntil(catchLog(caches.keys()
			.then(async keys => {
				// delete old caches
				await Promise.all(Object.keys(keys)
					.filter(key => key !== ASSETS)
					.map(key => caches.delete(key)))

				await self.clients.claim()
			})))
	})

	self.addEventListener('fetch', event => {
		if (event.request.method !== 'GET' || event.request.headers.has('range')) {
			return
		}

		const url = new URL(event.request.url)

		// don't try to handle e.g. data: URIs
		// if (!url.protocol.startsWith('http')) {
		// 	return
		// }

		// ignore dev server requests
		if (url.hostname === self.location.hostname && url.port === self.location.port) {
			return
		}

		// ignore external requests
		if (url.hostname !== self.location.hostname
			// except static files:
			&& !/\.(png|jpe?g|gif|tiff?|woff2?|ttf|ico)$/ig.test(url.href)
		) {
			return
		}

		// always serve static files and bundler-generated assets from cache
		if (url.host === self.location.host && cached.has(url.pathname)) {
			catchLog(event.respondWith(catchLog(caches.match(event.request))))
			return
		}

		// for pages, you might want to serve a shell `service-worker-index.html` file,
		// which Sapper has generated for you. It's not right for every
		// app, but if it's right for yours then uncomment this section
		// if (url.origin === self.origin && routes.find(route => route.pattern.test(url.pathname))) {
		// event.respondWith(caches.match('/service-worker-index.html'));
		// return;
		// }

		if (event.request.cache === 'only-if-cached') {
			return
		}

		// for everything else, try the network first, falling back to
		// cache if the user is offline. (If the pages never change, you
		// might prefer a cache-first approach to a network-first one.)
		catchLog(event.respondWith(catchLog(caches
			.open(`offline${timestamp}`)
			.then(async cache => {
				try {
					const response = await fetch(event.request)
					await cache.put(event.request, response.clone())
					return response
				} catch (err) {
					const response = await cache.match(event.request)
					if (response) {
						return response
					}
					throw err
				}
			}))
		))
	})
}

// init()
