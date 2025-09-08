self.addEventListener('push', (event) => {
  //const data = event.data.json();

  console.log("El evento es: ", event)

  // self.registration.showNotification(
  //   // data.title
  //   "Prueba"
  //   , {
  //   // body: data.body,
  //   // icon: data.icon
  //   body: "Ejemplo de notificacion",
  //   icon: "../assets/pcgroup.png"
  // });
});