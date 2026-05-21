const API = "http://localhost:3000";


const postsList = document.getElementById("postsList");
const postForm = document.getElementById("postForm");
const inputAutor = document.getElementById("inputAutor");
const inputConteudo = document.getElementById("inputConteudo");
const btnPublish = document.getElementById("btnPublish");

const feedLoading = document.getElementById("feedLoading");
const feedEmpty = document.getElementById("feedEmpty");
const feedError = document.getElementById("feedError");
const feedErrorMsg = document.getElementById("feedErrorMsg");

const postCount = document.getElementById("postCount");
const statPosts = document.getElementById("statPosts");
const statLikes = document.getElementById("statLikes");
const statComments = document.getElementById("statComments");

const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");

const btnRefresh = document.getElementById("btnRefresh");

function toast(msg, type = "info") {
    const container = document.getElementById("toastContainer");

    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.innerHTML = `
    <i class="fa-solid fa-circle-info"></i>
    <div class="toast-text">${msg}</div>`;

    container.appendChild(el);

    setTimeout(() => {
        el.classList.add("hiding");

        setTimeout(() => {
            el.remove()
        }, 300);
    }, 2500);
}

function setStatus(ok) {
    statusDot.classList.remove("online", "offline");
    if (ok) {
        statusDot.classList.add("online");
        statusText.innerText = "ONLINE";
    } else {
        statusDot.classList.add("offline");
        statusText.innerText = "OFFLINE";
    }
}

async function carregarPosts() {
    try {
        feedLoading.style.display = "block";
        feedError.style.display = "none";
        feedEmpty.style.display = "none";
        postsList.innerHTML = "";

        const res = await fetch(`${API}/posts`);

        if (!res.ok) {
            throw new Error("Erro ao buscar posts")
        };

        const posts = await res.json();
        setStatus(true);

        feedLoading.style.display = "none";

        if (posts.length === 0) {
            feedEmpty.style.display = "block";
            atualizarStats([]);
            return;
        }

        posts.forEach(renderPost);

        atualizarStats(posts);
        
    } catch (err) {
        console.error(err);
        setStatus(false);

        feedLoading.style.display = "none";
        feedError.style.display = "block";
        feedErrorMsg.innerText = err.message;
    }

}



function renderPost(post) {

    const el = document.createElement("div");

    el.className = "post-card";

    el.innerHTML = `
    <div class="post-header">

        <div class="post-avatar" style="background:#00ff9d">
            ${post.autor[0].toUpperCase()}
        </div>

        <div class="post-author">
            ${post.autor}
        </div>

        <div class="post-time">
            #${post.id}
        </div>

        <button class="btn-delete">
            <i class="fa-solid fa-trash"></i>
        </button>

    </div>
    
    <div class="post-body">
        ${post.conteudo}
    </div>

    <div class="post-footer">

        <button class="btn-like">
            <i class="fa-solid fa-heart"></i>
            <span>
                ${post.total_likes || 0}
            </span>
        </button>

        <button class="btn-comments">
            <i class="fa-solid fa-comments"></i>
            Comentários
        </button>
    </div>

    <div class="post-comments">

        <div class="post-comments-list"></div>

        <div class="comment-form">

            <div class="comment-inputs">
                <input class="comment-autor-input" placeholder="autor">
                <input class="comment-texto-input" placeholder="comentário">
            </div>

            <button class="btn-add-comment">
                Enviar
            </button>

        </div>
    </div>`;

    const likeBtn = el.querySelector(".btn-like");

    likeBtn.onclick = async () => {

        try {

            await fetch(`${API}/likes/${post.id}`, {
                method: "POST"
            });

            const span = likeBtn.querySelector("span");

            span.innerText = Number(span.innerText) + 1;

            likeBtn.classList.add("liked", "pumping");

            setTimeout(() => {
                likeBtn.classList.remove("pumping");
            }, 400);

        } catch {
            toast("Erro ao Curtir", "error");
        }
    };

    const deleteBtn = el.querySelector(".btn-delete");

    deleteBtn.onclick = async () => {

        if (!confirm("Deletar post?")) return;

        try {

            await fetch(`${API}/posts/${post.id}`, {
                method: "DELETE"
            });

            el.classList.add("removing");

            setTimeout(() => {
                el.remove();
                carregarPosts();
            }, 300);

        } catch {
            toast("Erro ao deletar", "error");
        }
    };

    const btnComments = el.querySelector(".btn-comments");

    const commentsBox = el.querySelector(".post-comments");

    const commentsList = el.querySelector(".post-comments-list");

    btnComments.onclick = async () => {

        commentsBox.classList.toggle("open");

        if (commentsList.innerHTML !== "") return;

        commentsList.innerHTML = "Carregando...";

        try {

            const res = await fetch(`${API}/comentarios/${post.id}`);

            const comentarios = await res.json();

            commentsList.innerHTML = "";

            if (comentarios.length === 0) {

                commentsList.innerHTML = `
                <div class="comments-empty">
                    Sem comentários
                </div>`;

                return;
            }

            comentarios.forEach(c => {

                const item = document.createElement("div");

                item.className = "comment-item";

                item.innerHTML = `
                <div class="comment-avatar" style="background:#ff2d78">
                    ${c.autor[0].toUpperCase()}
                </div>

                <div>
                    <div class="comment-author">
                        ${c.autor}
                    </div>

                    <div class="comment-text">
                        ${c.conteudo}
                    </div>
                </div>
                `;

                commentsList.appendChild(item);
            });

        } catch {
            commentsList.innerHTML = "Erro ao carregar comentários";
        }
    };

    const btnAdd = el.querySelector(".btn-add-comment");

    btnAdd.onclick = async () => {

        const autor = el.querySelector(".comment-autor-input").value;

        const conteudo = el.querySelector(".comment-texto-input").value;

        if (!autor || !conteudo) {
            return toast("Preencha o comentário", "error");
        }

        try {

            await fetch(`${API}/comentarios/${post.id}`, {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    autor,
                    conteudo
                })
            });

            toast("Comentario enviado", "success");

            commentsList.innerHTML = "";

            btnComments.click();

        } catch {
            toast("Erro ao comentar", "error");
        }
    };

    postsList.appendChild(el);
}

postForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const autor = inputAutor.value;

    const conteudo = inputConteudo.value;

    if (!autor || !conteudo) {
        return toast("Preencha todos campos", "error");
    }

    btnPublish.disabled = true;

    try {

        await fetch(`${API}/posts`, {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                autor,
                conteudo
            })
        });

        inputAutor.value = "";
        inputConteudo.value = "";

        toast("Post criado!", "success");

        carregarPosts();

    } catch {
        toast("Erro ao criar post", "error");

    } finally {
        btnPublish.disabled = false;
    }
});

function atualizarStats(posts) {
    postCount.innerText = posts.length;
    statPosts.innerText = posts.length;

    let totalLikes = 0;

    posts.forEach(p => {
        totalLikes += p.total_likes || 0;
    });

    statLikes.innerText = totalLikes;

    statComments.innerText = "-"
}

btnRefresh.onclick = carregarPosts

carregarPosts();