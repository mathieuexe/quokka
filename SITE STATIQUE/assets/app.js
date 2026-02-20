import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://rpfvkqyzkczrgjsyukhg.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_hyKjtOdqwmPYgZNJaKz4bQ_hbcjVqaO";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const state = {
  user: null,
  profile: null,
  categories: []
};

const qs = (selector, scope = document) => scope.querySelector(selector);
const qsa = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

const formatCurrency = (value) => `${Number(value).toFixed(2)} EUR`;
const formatDate = (value) => new Date(value).toLocaleString("fr-FR");

const setStatus = (container, message, type = "error") => {
  if (!container) return;
  container.innerHTML = "";
  if (!message) return;
  const box = document.createElement("div");
  box.className = `alert ${type === "success" ? "success" : ""}`;
  box.textContent = message;
  container.appendChild(box);
};

const setActiveTab = (tab) => {
  qsa("[data-tab]").forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === tab));
  qsa("[data-section]").forEach((section) => {
    section.hidden = section.dataset.section !== tab;
  });
};

const getSessionUser = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
};

const ensureProfile = async (user) => {
  if (!user) {
    state.profile = null;
    return;
  }
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (data) {
    state.profile = data;
    return;
  }
  const pseudo = user.user_metadata?.pseudo || user.email?.split("@")[0] || "Utilisateur";
  const profilePayload = {
    id: user.id,
    pseudo,
    email: user.email ?? null
  };
  await supabase.from("profiles").insert(profilePayload);
  state.profile = profilePayload;
};

const updateAuthUI = () => {
  const isLoggedIn = Boolean(state.user);
  qsa("[data-auth='guest']").forEach((el) => {
    el.style.display = isLoggedIn ? "none" : "flex";
  });
  qsa("[data-auth='user']").forEach((el) => {
    el.style.display = isLoggedIn ? "flex" : "none";
  });
  const pseudoEl = qs("[data-user-pseudo]");
  if (pseudoEl) {
    pseudoEl.textContent = state.profile?.pseudo || state.user?.email || "Compte";
  }
  const avatarEl = qs("[data-user-avatar]");
  if (avatarEl) {
    avatarEl.textContent = (state.profile?.pseudo || "Q").slice(0, 1).toUpperCase();
    if (state.profile?.avatar_url) {
      avatarEl.style.backgroundImage = `url(${state.profile.avatar_url})`;
      avatarEl.style.backgroundSize = "cover";
      avatarEl.style.backgroundPosition = "center";
      avatarEl.textContent = "";
    }
  }
};

const loadCategories = async () => {
  if (state.categories.length) return state.categories;
  const { data, error } = await supabase.from("categories").select("*").order("label");
  if (error) {
    state.categories = [];
    return [];
  }
  state.categories = data ?? [];
  return state.categories;
};

const getCategoryMap = async () => {
  const categories = await loadCategories();
  return categories.reduce((acc, cat) => {
    acc[cat.id] = cat;
    return acc;
  }, {});
};

const getServers = async ({ search = "", categoryId = "" } = {}) => {
  let query = supabase.from("servers").select("*").order("created_at", { ascending: false });
  if (search) {
    const escaped = search.replace(/%/g, "");
    query = query.or(`name.ilike.%${escaped}%,description.ilike.%${escaped}%`);
  }
  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).filter((server) => {
    const isVisible = server.is_visible ?? true;
    const isHidden = server.is_hidden ?? false;
    return isVisible && !isHidden;
  });
};

const updateServerCounter = async (server, field) => {
  if (!server?.id) return;
  const currentValue = Number(server[field] ?? 0);
  await supabase.from("servers").update({ [field]: currentValue + 1 }).eq("id", server.id);
};

const buildServerCard = (server, categoriesMap, { showActions = true } = {}) => {
  const card = document.createElement("article");
  card.className = "card server-card";

  const title = document.createElement("h3");
  title.textContent = server.name || "Serveur";
  card.appendChild(title);

  const badges = document.createElement("div");
  badges.className = "server-badges";
  const category = categoriesMap[server.category_id];
  const categoryLabel = server.category_label || category?.label || "Catégorie";
  const categoryTag = document.createElement("span");
  categoryTag.className = "tag";
  categoryTag.textContent = categoryLabel;
  badges.appendChild(categoryTag);
  if (server.premium_type) {
    const premiumTag = document.createElement("span");
    premiumTag.className = "tag tag-premium";
    premiumTag.textContent = server.premium_type === "quokka_plus" ? "Quokka+" : "Essentiel";
    badges.appendChild(premiumTag);
  }
  if (server.verified) {
    const verifiedTag = document.createElement("span");
    verifiedTag.className = "tag";
    verifiedTag.textContent = "Vérifié";
    badges.appendChild(verifiedTag);
  }
  card.appendChild(badges);

  if (server.banner_url) {
    const banner = document.createElement("img");
    banner.className = "server-banner";
    banner.alt = `Bannière ${server.name}`;
    banner.src = server.banner_url;
    card.appendChild(banner);
  }

  const description = document.createElement("p");
  description.textContent = server.description || "";
  card.appendChild(description);

  const stats = document.createElement("div");
  stats.className = "server-stats";
  stats.innerHTML = `
    <span>Vues: ${server.views ?? 0}</span>
    <span>J'aime: ${server.likes ?? 0}</span>
    <span>Visites: ${server.visits ?? 0}</span>
  `;
  card.appendChild(stats);

  if (showActions) {
    const actions = document.createElement("div");
    actions.className = "server-card-actions";

    const voteBtn = document.createElement("button");
    voteBtn.className = "btn btn-ghost";
    voteBtn.type = "button";
    voteBtn.textContent = "Voter";
    voteBtn.addEventListener("click", async () => {
      const res = await voteServer(server.id);
      if (res?.likes !== undefined) {
        stats.innerHTML = `
          <span>Vues: ${server.views ?? 0}</span>
          <span>J'aime: ${res.likes}</span>
          <span>Visites: ${server.visits ?? 0}</span>
        `;
      }
    });
    actions.appendChild(voteBtn);

    const joinBtn = document.createElement("a");
    joinBtn.className = "btn";
    joinBtn.textContent = "Rejoindre";
    if (server.invite_link) {
      joinBtn.href = server.invite_link;
      joinBtn.target = "_blank";
      joinBtn.rel = "noreferrer";
    } else if (server.ip && server.port) {
      joinBtn.href = "#";
      joinBtn.addEventListener("click", async (event) => {
        event.preventDefault();
        await navigator.clipboard.writeText(`${server.ip}:${server.port}`);
      });
    }
    joinBtn.addEventListener("click", () => updateServerCounter(server, "clicks"));
    actions.appendChild(joinBtn);

    const detailBtn = document.createElement("a");
    detailBtn.className = "btn btn-ghost";
    detailBtn.href = `./server.html?id=${server.id}`;
    detailBtn.textContent = "Voir la fiche";
    actions.appendChild(detailBtn);

    card.appendChild(actions);
  }

  return card;
};

const voteServer = async (serverId) => {
  if (!state.user) {
    alert("Connectez-vous pour voter.");
    return null;
  }
  const existing = await supabase
    .from("server_votes")
    .select("id")
    .eq("server_id", serverId)
    .eq("user_id", state.user.id)
    .maybeSingle();
  if (existing.data) {
    alert("Vous avez déjà voté pour ce serveur.");
    return null;
  }
  await supabase.from("server_votes").insert({ server_id: serverId, user_id: state.user.id });
  const countResult = await supabase
    .from("server_votes")
    .select("*", { count: "exact", head: true })
    .eq("server_id", serverId);
  const likes = countResult.count ?? 0;
  await supabase.from("servers").update({ likes }).eq("id", serverId);
  return { likes };
};

const initHome = async () => {
  const grid = qs("[data-server-grid]");
  const countEl = qs("[data-results-count]");
  const status = qs("[data-status]");
  const searchForm = qs("[data-search-form]");
  const searchInput = qs("[data-search-input]");

  const categories = await loadCategories();
  const totalServers = await supabase.from("servers").select("id", { count: "exact", head: true });
  const totalVotes = await supabase.from("server_votes").select("id", { count: "exact", head: true });

  const statServers = qs("[data-stat-servers]");
  const statVotes = qs("[data-stat-votes]");
  const statCategories = qs("[data-stat-categories]");

  if (statServers) statServers.textContent = String(totalServers.count ?? 0);
  if (statVotes) statVotes.textContent = String(totalVotes.count ?? 0);
  if (statCategories) statCategories.textContent = String(categories.length);

  const render = async () => {
    try {
      setStatus(status, "");
      grid.innerHTML = "";
      const servers = await getServers({ search: searchInput?.value ?? "" });
      const map = await getCategoryMap();
      servers.slice(0, 6).forEach((server) => grid.appendChild(buildServerCard(server, map)));
      if (countEl) countEl.textContent = String(servers.length);
      if (!servers.length) {
        setStatus(status, "Aucun serveur trouvé.", "error");
      }
    } catch (error) {
      setStatus(status, error?.message || "Erreur de chargement.");
    }
  };

  if (searchForm) {
    searchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      render();
    });
  }

  render();
};

const initServers = async () => {
  const grid = qs("[data-server-grid]");
  const countEl = qs("[data-results-count]");
  const status = qs("[data-status]");
  const searchForm = qs("[data-search-form]");
  const searchInput = qs("[data-search-input]");
  const categoryFilter = qs("[data-category-filter]");

  const categories = await loadCategories();
  if (categoryFilter) {
    categories.forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat.id;
      option.textContent = cat.label;
      categoryFilter.appendChild(option);
    });
  }

  const render = async () => {
    try {
      setStatus(status, "");
      grid.innerHTML = "";
      const servers = await getServers({
        search: searchInput?.value ?? "",
        categoryId: categoryFilter?.value ?? ""
      });
      const map = await getCategoryMap();
      servers.forEach((server) => grid.appendChild(buildServerCard(server, map)));
      if (countEl) countEl.textContent = String(servers.length);
      if (!servers.length) {
        setStatus(status, "Aucun serveur trouvé.", "error");
      }
    } catch (error) {
      setStatus(status, error?.message || "Erreur de chargement.");
    }
  };

  if (searchForm) {
    searchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      render();
    });
  }

  render();
};

const initServerDetail = async () => {
  const detailContainer = qs("[data-server-detail]");
  const status = qs("[data-status]");
  const params = new URLSearchParams(window.location.search);
  const serverId = params.get("id");
  if (!serverId) {
    setStatus(status, "Serveur introuvable.");
    return;
  }
  try {
    const { data } = await supabase.from("servers").select("*").eq("id", serverId).maybeSingle();
    if (!data) {
      setStatus(status, "Serveur introuvable.");
      return;
    }
    const categoryMap = await getCategoryMap();
    const category = categoryMap[data.category_id];
    const categoryLabel = data.category_label || category?.label || "Catégorie";
    const card = document.createElement("div");
    card.className = "card server-detail-grid";
    card.innerHTML = `
      ${data.banner_url ? `<img class="server-banner" src="${data.banner_url}" alt="Bannière ${data.name}">` : ""}
      <div class="section-title">
        <div>
          <h1>${data.name}</h1>
          <p class="muted">${categoryLabel}</p>
        </div>
      </div>
      <p>${data.description || ""}</p>
      <div class="server-card-actions">
        <button class="btn btn-ghost" data-vote>Voter</button>
        <a class="btn" data-join href="#">Rejoindre</a>
        <a class="btn btn-ghost" href="./servers.html">Retour</a>
      </div>
      <div class="server-meta-grid">
        <div class="stat-card"><span class="muted">Référence</span><strong>#${data.reference_number ?? "—"}</strong></div>
        <div class="stat-card"><span class="muted">Pays</span><strong>${data.country_code ?? "—"}</strong></div>
        <div class="stat-card"><span class="muted">Site</span><strong>${data.website ?? "—"}</strong></div>
        <div class="stat-card"><span class="muted">Connexion</span><strong>${data.invite_link ? "Invitation" : `${data.ip ?? ""}${data.port ? ":" + data.port : ""}`}</strong></div>
      </div>
      <div class="stat-grid">
        <div class="stat-card"><span class="muted">Vues</span><strong>${data.views ?? 0}</strong></div>
        <div class="stat-card"><span class="muted">J'aime</span><strong data-like-count>${data.likes ?? 0}</strong></div>
        <div class="stat-card"><span class="muted">Visites</span><strong>${data.visits ?? 0}</strong></div>
        <div class="stat-card"><span class="muted">Clics</span><strong>${data.clicks ?? 0}</strong></div>
      </div>
    `;
    detailContainer.appendChild(card);
    updateServerCounter(data, "views");
    updateServerCounter(data, "visits");

    const joinBtn = qs("[data-join]", card);
    if (data.invite_link) {
      joinBtn.href = data.invite_link;
      joinBtn.target = "_blank";
      joinBtn.rel = "noreferrer";
    } else {
      joinBtn.addEventListener("click", async (event) => {
        event.preventDefault();
        if (data.ip && data.port) {
          await navigator.clipboard.writeText(`${data.ip}:${data.port}`);
        }
      });
    }
    joinBtn.addEventListener("click", () => updateServerCounter(data, "clicks"));

    const voteBtn = qs("[data-vote]", card);
    const likeCount = qs("[data-like-count]", card);
    voteBtn.addEventListener("click", async () => {
      const res = await voteServer(serverId);
      if (res?.likes !== undefined && likeCount) {
        likeCount.textContent = String(res.likes);
      }
    });
  } catch (error) {
    setStatus(status, error?.message || "Erreur de chargement.");
  }
};

const initLogin = async () => {
  const form = qs("[data-login-form]");
  const status = qs("[data-status]", form);
  if (!form) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus(status, "");
    const email = form.elements.email.value.trim();
    const password = form.elements.password.value;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setStatus(status, error.message);
      return;
    }
    window.location.href = "./dashboard.html";
  });
};

const initRegister = async () => {
  const form = qs("[data-register-form]");
  const status = qs("[data-status]", form);
  if (!form) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus(status, "");
    const pseudo = form.elements.pseudo.value.trim();
    const email = form.elements.email.value.trim();
    const password = form.elements.password.value;
    const confirm = form.elements.confirmPassword.value;
    if (password !== confirm) {
      setStatus(status, "Les mots de passe ne correspondent pas.");
      return;
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { pseudo }
      }
    });
    if (error) {
      setStatus(status, error.message);
      return;
    }
    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        pseudo,
        email
      });
    }
    setStatus(status, "Compte créé. Vérifiez vos emails pour activer votre compte.", "success");
  });
};

const initAddServer = async () => {
  const form = qs("[data-add-server-form]");
  const status = qs("[data-status]", form);
  const previewName = qs("[data-preview-name]");
  const previewCategory = qs("[data-preview-category]");
  const previewConnection = qs("[data-preview-connection]");
  if (!form) return;
  if (!state.user) {
    setStatus(status, "Connectez-vous pour ajouter un serveur.");
    return;
  }

  const categories = await loadCategories();
  const select = qs("[data-category-select]");
  categories.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat.id;
    option.textContent = cat.label;
    select.appendChild(option);
  });

  const updatePreview = () => {
    const category = categories.find((cat) => cat.id === select.value);
    previewName.textContent = form.elements.name.value || "Nom du serveur";
    previewCategory.textContent = category?.label || "Catégorie";
    const invite = form.elements.invite.value.trim();
    const ip = form.elements.ip.value.trim();
    const port = form.elements.port.value.trim();
    previewConnection.textContent = invite || (ip && port ? `${ip}:${port}` : "IP:PORT");
  };

  form.addEventListener("input", updatePreview);
  updatePreview();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus(status, "");
    const payload = {
      user_id: state.user.id,
      user_pseudo: state.profile?.pseudo || state.user.email,
      user_avatar_url: state.profile?.avatar_url || null,
      category_id: select.value,
      name: form.elements.name.value.trim(),
      website: form.elements.website.value.trim() || null,
      description: form.elements.description.value.trim(),
      banner_url: form.elements.banner.value.trim() || null,
      country_code: form.elements.country.value,
      ip: form.elements.ip.value.trim() || null,
      port: form.elements.port.value ? Number(form.elements.port.value) : null,
      invite_link: form.elements.invite.value.trim() || null,
      is_public: form.elements.public.checked,
      is_hidden: false,
      is_visible: true,
      verified: false,
      premium_type: null,
      views: 0,
      likes: 0,
      visits: 0,
      clicks: 0
    };
    const { error } = await supabase.from("servers").insert(payload);
    if (error) {
      setStatus(status, error.message);
      return;
    }
    form.reset();
    updatePreview();
    setStatus(status, "Serveur ajouté avec succès.", "success");
  });
};

const initDashboard = async () => {
  if (!state.user) {
    setStatus(qs("[data-status]"), "Connectez-vous pour accéder au dashboard.");
    return;
  }
  const profileForm = qs("[data-profile-form]");
  const socialForm = qs("[data-social-form]");
  const profileSaved = qs("[data-profile-saved]");
  const serversGrid = qs("[data-dashboard-servers]");
  const editForm = qs("[data-edit-server-form]");
  const editStatus = qs("[data-edit-status]");
  const subscriptionList = qs("[data-dashboard-subscriptions]");

  const tabs = qsa("[data-tab]");
  tabs.forEach((btn) => btn.addEventListener("click", () => setActiveTab(btn.dataset.tab)));

  const profile = state.profile || {};
  if (profileForm) {
    profileForm.elements.pseudo.value = profile.pseudo || "";
    profileForm.elements.bio.value = profile.bio || "";
    profileForm.elements.avatar.value = profile.avatar_url || "";
  }
  if (socialForm) {
    socialForm.elements.discord.value = profile.discord_url || "";
    socialForm.elements.x.value = profile.x_url || "";
    socialForm.elements.bluesky.value = profile.bluesky_url || "";
    socialForm.elements.youtube.value = profile.youtube_url || "";
    socialForm.elements.twitch.value = profile.twitch_url || "";
  }

  profileForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const update = {
      pseudo: profileForm.elements.pseudo.value.trim(),
      bio: profileForm.elements.bio.value.trim(),
      avatar_url: profileForm.elements.avatar.value.trim()
    };
    const { error } = await supabase.from("profiles").update(update).eq("id", state.user.id);
    if (error) {
      setStatus(qs("[data-status]"), error.message);
      return;
    }
    state.profile = { ...state.profile, ...update };
    updateAuthUI();
    if (profileSaved) profileSaved.textContent = "Profil mis à jour.";
  });

  socialForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const update = {
      discord_url: socialForm.elements.discord.value.trim() || null,
      x_url: socialForm.elements.x.value.trim() || null,
      bluesky_url: socialForm.elements.bluesky.value.trim() || null,
      youtube_url: socialForm.elements.youtube.value.trim() || null,
      twitch_url: socialForm.elements.twitch.value.trim() || null
    };
    const { error } = await supabase.from("profiles").update(update).eq("id", state.user.id);
    if (error) {
      setStatus(qs("[data-status]"), error.message);
      return;
    }
    state.profile = { ...state.profile, ...update };
    setStatus(qs("[data-status]"), "Réseaux mis à jour.", "success");
  });

  const categories = await loadCategories();
  const editCategory = qs("[data-edit-category]");
  categories.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat.id;
    option.textContent = cat.label;
    editCategory.appendChild(option);
  });

  const { data: servers } = await supabase.from("servers").select("*").eq("user_id", state.user.id);
  serversGrid.innerHTML = "";
  (servers || []).forEach((server) => {
    const card = buildServerCard(server, categories.reduce((acc, cat) => ({ ...acc, [cat.id]: cat }), {}), { showActions: false });
    const actions = document.createElement("div");
    actions.className = "server-card-actions";
    const editBtn = document.createElement("button");
    editBtn.className = "btn btn-ghost";
    editBtn.type = "button";
    editBtn.textContent = "Éditer";
    editBtn.addEventListener("click", () => {
      editForm.elements.serverId.value = server.id;
      editForm.elements.name.value = server.name || "";
      editForm.elements.description.value = server.description || "";
      editForm.elements.website.value = server.website || "";
      editForm.elements.country.value = server.country_code || "FR";
      editForm.elements.ip.value = server.ip || "";
      editForm.elements.port.value = server.port || 25565;
      editForm.elements.invite.value = server.invite_link || "";
      editForm.elements.banner.value = server.banner_url || "";
      editForm.elements.public.checked = server.is_public ?? true;
      editCategory.value = server.category_id || "";
      setActiveTab("servers");
    });
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn btn-danger";
    deleteBtn.type = "button";
    deleteBtn.textContent = "Supprimer";
    deleteBtn.addEventListener("click", async () => {
      const confirmed = window.confirm("Supprimer ce serveur ?");
      if (!confirmed) return;
      const { error } = await supabase.from("servers").delete().eq("id", server.id);
      if (error) {
        setStatus(qs("[data-status]"), error.message);
        return;
      }
      card.remove();
    });
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    card.appendChild(actions);
    serversGrid.appendChild(card);
  });

  editForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus(editStatus, "");
    const serverId = editForm.elements.serverId.value;
    if (!serverId) {
      setStatus(editStatus, "Sélectionnez un serveur.");
      return;
    }
    const payload = {
      category_id: editCategory.value,
      name: editForm.elements.name.value.trim(),
      description: editForm.elements.description.value.trim(),
      website: editForm.elements.website.value.trim() || null,
      country_code: editForm.elements.country.value,
      ip: editForm.elements.ip.value.trim() || null,
      port: editForm.elements.port.value ? Number(editForm.elements.port.value) : null,
      invite_link: editForm.elements.invite.value.trim() || null,
      banner_url: editForm.elements.banner.value.trim() || null,
      is_public: editForm.elements.public.checked
    };
    const { error } = await supabase.from("servers").update(payload).eq("id", serverId);
    if (error) {
      setStatus(editStatus, error.message);
      return;
    }
    setStatus(editStatus, "Serveur mis à jour.", "success");
  });

  const { data: subscriptions } = await supabase.from("subscriptions").select("*").eq("user_id", state.user.id).order("created_at", { ascending: false });
  subscriptionList.innerHTML = "";
  (subscriptions || []).forEach((sub) => {
    const item = document.createElement("div");
    item.className = "table-item";
    item.innerHTML = `
      <div class="table-item-head">
        <strong>${sub.server_name || "Serveur"}</strong>
        <span class="pill ${sub.status === "completed" ? "success" : sub.status === "pending" ? "pending" : "failed"}">${sub.status || "pending"}</span>
      </div>
      <span class="muted">${sub.subscription_type === "quokka_plus" ? "Quokka+" : "Essentiel"}</span>
      <span class="muted">${formatCurrency((sub.amount_cents ?? 0) / 100)}</span>
      <span class="muted">${sub.created_at ? formatDate(sub.created_at) : ""}</span>
    `;
    subscriptionList.appendChild(item);
  });
};

const initOffers = async () => {
  if (!state.user) {
    setStatus(qs("[data-status]"), "Connectez-vous pour gérer les offres.");
    return;
  }
  const list = qs("[data-offer-servers]");
  const form = qs("[data-offer-form]");
  const status = qs("[data-status]", form);
  const totalEl = qs("[data-offer-total]");
  const summary = qs("[data-offer-summary]");
  let selectedServer = null;

  const { data: servers } = await supabase.from("servers").select("*").eq("user_id", state.user.id);
  list.innerHTML = "";
  (servers || []).forEach((server) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "table-item";
    item.innerHTML = `<strong>${server.name}</strong><span class="muted">${server.category_label || ""}</span>`;
    item.addEventListener("click", () => {
      selectedServer = server;
      qsa(".table-item", list).forEach((el) => el.classList.remove("active"));
      item.classList.add("active");
      updateSummary();
    });
    list.appendChild(item);
  });

  const computeTotal = () => {
    const type = form.elements.type.value;
    const days = Number(form.elements.days.value || 0);
    const hours = Number(form.elements.hours.value || 0);
    const total = type === "essentiel" ? Math.min(Math.max(days, 1), 30) * 5 : Math.min(Math.max(hours, 1), 24) * 1;
    totalEl.textContent = formatCurrency(total);
    return total;
  };

  const updateSummary = () => {
    summary.innerHTML = "";
    if (!selectedServer) {
      summary.innerHTML = "<div class='empty'>Sélectionnez un serveur.</div>";
      return;
    }
    const type = form.elements.type.value;
    const total = computeTotal();
    const startDate = form.elements.startDate.value || "Non défini";
    summary.innerHTML = `
      <div class="table-item">
        <strong>${selectedServer.name}</strong>
        <span class="muted">${type === "essentiel" ? "Quokka Essentiel" : "Quokka+"}</span>
        <span class="muted">Début : ${startDate}</span>
        <span class="muted">Total : ${formatCurrency(total)}</span>
      </div>
    `;
  };

  form.addEventListener("input", updateSummary);
  updateSummary();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!selectedServer) {
      setStatus(status, "Sélectionnez un serveur.");
      return;
    }
    const type = form.elements.type.value;
    const days = Number(form.elements.days.value || 0);
    const hours = Number(form.elements.hours.value || 0);
    const total = computeTotal();
    const payload = {
      user_id: state.user.id,
      server_id: selectedServer.id,
      server_name: selectedServer.name,
      subscription_type: type,
      amount_cents: Math.round(total * 100),
      duration_days: type === "essentiel" ? days : null,
      duration_hours: type === "quokka_plus" ? hours : null,
      status: "pending",
      planned_start_date: form.elements.startDate.value || null,
      created_at: new Date().toISOString()
    };
    const { error } = await supabase.from("subscriptions").insert(payload);
    if (error) {
      setStatus(status, error.message);
      return;
    }
    setStatus(status, "Offre enregistrée. Consultez vos abonnements.", "success");
  });
};

const initSubscriptions = async () => {
  if (!state.user) {
    setStatus(qs("[data-status]"), "Connectez-vous pour voir vos abonnements.");
    return;
  }
  const list = qs("[data-subscriptions-list]");
  const searchInput = qs("[data-subscriptions-search]");
  const status = qs("[data-status]");
  const filterButtons = qsa("[data-filter]");
  let currentFilter = "all";
  let subscriptions = [];

  const { data, error } = await supabase.from("subscriptions").select("*").eq("user_id", state.user.id).order("created_at", { ascending: false });
  if (error) {
    setStatus(status, error.message);
    return;
  }
  subscriptions = data || [];

  const render = () => {
    list.innerHTML = "";
    const searchValue = searchInput.value.trim().toLowerCase();
    const filtered = subscriptions.filter((item) => {
      const statusOk = currentFilter === "all" ? true : item.status === currentFilter;
      const searchOk =
        item.server_name?.toLowerCase().includes(searchValue) ||
        item.subscription_type?.toLowerCase().includes(searchValue) ||
        item.id?.toLowerCase().includes(searchValue);
      return statusOk && searchOk;
    });
    if (!filtered.length) {
      list.innerHTML = "<div class='empty'>Aucun abonnement trouvé.</div>";
      return;
    }
    filtered.forEach((sub) => {
      const item = document.createElement("div");
      item.className = "table-item";
      item.innerHTML = `
        <div class="table-item-head">
          <strong>${sub.server_name || "Serveur"}</strong>
          <span class="pill ${sub.status === "completed" ? "success" : sub.status === "pending" ? "pending" : "failed"}">${sub.status || "pending"}</span>
        </div>
        <span class="muted">${sub.subscription_type === "quokka_plus" ? "Quokka+" : "Essentiel"}</span>
        <span class="muted">${formatCurrency((sub.amount_cents ?? 0) / 100)}</span>
        <span class="muted">${sub.created_at ? formatDate(sub.created_at) : ""}</span>
      `;
      list.appendChild(item);
    });
  };

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      currentFilter = btn.dataset.filter;
      render();
    });
  });
  searchInput.addEventListener("input", render);
  render();
};

const initCommonActions = () => {
  const logoutBtn = qs("[data-action='logout']");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await supabase.auth.signOut();
      window.location.href = "./index.html";
    });
  }
  const refreshBtn = qs("[data-action='refresh-session']");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", async () => {
      await supabase.auth.refreshSession();
      setStatus(qs("[data-status]"), "Session rafraîchie.", "success");
    });
  }
};

const initPage = async () => {
  const page = document.body.dataset.page;
  if (page === "home") await initHome();
  if (page === "servers") await initServers();
  if (page === "server") await initServerDetail();
  if (page === "login") await initLogin();
  if (page === "register") await initRegister();
  if (page === "add-server") await initAddServer();
  if (page === "dashboard") await initDashboard();
  if (page === "offers") await initOffers();
  if (page === "subscriptions") await initSubscriptions();
};

const init = async () => {
  state.user = await getSessionUser();
  await ensureProfile(state.user);
  updateAuthUI();
  supabase.auth.onAuthStateChange(async (_, session) => {
    state.user = session?.user ?? null;
    await ensureProfile(state.user);
    updateAuthUI();
  });
  initCommonActions();
  await initPage();
};

init();
