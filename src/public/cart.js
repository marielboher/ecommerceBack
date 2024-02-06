const obtenerIdCarrito = async () => {
  try {
    const response = await fetch("/api/carts/usuario/carrito", {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!response.ok) {
      console.error("Error obteniendo el ID del carrito");
      return null;
    }

    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error("Error obteniendo el ID del carrito: ", error);
    return null;
  }
};
const agregarProductoAlCarrito = async (pid) => {
  try {
    const cid = await obtenerIdCarrito();

    if (!cid) {
      console.error("El ID del carrito es inválido.");
      return;
    }

    const response = await fetch(`/api/carts/${cid}/products/${pid}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      console.error("Error al agregar el producto al carrito.");
      return;
    }

    Swal.fire({
      position: "top-end",
      icon: "success",
      title: "Producto agregado al carrito",
      showConfirmButton: false,
      timer: 1500,
    });
    console.log("Producto agregado al carrito con éxito.");
  } catch (error) {
    console.error("Error al agregar el producto al carrito: " + error);
  }
};

async function realizarCompra() {
  Swal.fire({
    title: "¿Estás seguro?",
    text: "¡No podrás revertir esta acción!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Sí, realizar compra",
    cancelButtonText: "No, cancelar",
    reverseButtons: true,
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const cid = await obtenerIdCarrito();
        if (!cid) {
          console.error("El ID del carrito es inválido.");
          return;
        }
        const response = await fetch(`/api/carts/${cid}/purchase`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) {
          console.error("Error al realizar la compra.");
          return;
        }
        Swal.fire(
          "¡Compra Realizada!",
          "Tu compra se ha realizado con éxito.",
          "success"
        );
        console.log("Compra realizada con éxito.");
      } catch (error) {
        console.error("Error al realizar la compra: " + error);
      }
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      Swal.fire(
        "Cancelado",
        "Tu compra ha sido cancelada.",
        "error"
      );
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const cartButton = document.getElementById("cartButton");

  if (cartButton) {
    cartButton.addEventListener("click", async () => {
      try {
        const cid = await obtenerIdCarrito();

        if (cid) {
          window.location.assign(`/carts/`);
        } else {
          console.error("El ID del carrito es inválido.");
        }
      } catch (error) {
        console.error("Error al obtener el ID del carrito: " + error);
      }

      e.preventDefault();
    });
  }
});

const eliminarProductoDelCarrito = async (pid) => {
  try {
    const cid = await obtenerIdCarrito();

    const response = await fetch(`/api/carts/${cid}/products/${pid}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error("Error al eliminar el producto del carrito.");
    }

    console.log("Producto eliminado del carrito con éxito.");
  } catch (error) {
    console.error("Error al eliminar el producto del carrito: " + error);
  }
};

// const stripe = Stripe(
//   "pk_test_51OK8OXDX4BZZepd42OZURSX0gn2wd2HfyQ48zaOeFHICzZwCcrT3Uj2EZc3eCwWQuXPNtrGrOplyfqTwPNknjbtB00exkeqFla"
// );

// const checkoutButton = document.getElementById("checkout-button");
// checkoutButton.addEventListener("click", () => {
//   fetch("/create-checkout-session", {
//     method: "POST",
//   })
//     .then((response) => response.json())
//     .then((session) => {
//       return stripe.redirectToCheckout({ sessionId: session.id });
//     })
//     .then((result) => {
//       if (result.error) {
//         alert(result.error.message);
//       }
//     })
//     .catch((error) => {
//       console.error("Error:", error);
//     });
// });
