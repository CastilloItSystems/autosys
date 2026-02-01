importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js"
);

const firebaseConfig = {
  apiKey: "AIzaSyCY6v4KIMlFWRc9jjCqtZVStCrjVfOx50E",
  authDomain: "maroilrefinery.firebaseapp.com",
  projectId: "maroilrefinery",
  storageBucket: "maroilrefinery.firebasestorage.app",
  messagingSenderId: "666748400455",
  appId: "1:666748400455:web:5849c3c31f79cd82bf1262",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Configuración de notificaciones
messaging.onMessage((payload) => {
  const { title, body, image } = payload.notification || {};
  const notificationOptions = {
    body,
    icon: "/icon-192x192.png", // Usa el icono de tu PWA
    image: image, // Muestra imagen si viene en el payload
    data: payload.data, // Mantén los datos para el click
  };

  // Mostrar notificación
  new Notification(title || "Nueva notificación", notificationOptions);
});

// Manejar notificaciones en segundo plano
messaging.onBackgroundMessage((payload) => {
  const { title, body, image } = payload.notification || {};
  const notificationOptions = {
    body,
    icon: "/icon-192x192.png",
    badge: "/badge-96x96.png",
    image: image,
    vibrate: [200, 100, 200], // Vibración para dispositivos móviles
    data: payload.data, // Mantén los datos originales
  };

  return self.registration.showNotification(
    title || "Nueva notificación",
    notificationOptions
  );
});

// Manejar clic en notificación
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  // Usa el link del payload o uno por defecto
  const urlToOpen = new URL(
    event.notification.data?.link || "/",
    self.location.origin
  ).href;

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      // Busca si ya hay una pestaña abierta con esta URL
      for (const client of clientList) {
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }

      // Si no hay ninguna, abre una nueva
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Manejar cierre de notificación (opcional)
self.addEventListener("notificationclose", (event) => {});
