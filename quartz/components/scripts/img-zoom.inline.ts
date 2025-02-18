import mediumZoom from "medium-zoom";

const article = document.querySelectorAll("[data-article]");

console.log(article);

article.forEach((el) => {
  const imgs = el.querySelectorAll("img");

  imgs.forEach((img) => {
    mediumZoom(img, {
      margin: 24,
      background: "rgba(0, 0, 0, 0.8)",
      scrollOffset: 40,
    })
  })
})


