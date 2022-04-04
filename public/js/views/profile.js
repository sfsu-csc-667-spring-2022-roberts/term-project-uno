const joined = document.getElementById('joined');

// if valid date
if (!Number.isNaN(Date.parse(joined.innerHTML))) {
  const date = new Date(joined.innerHTML);
  joined.innerHTML = date.toLocaleDateString();
}