// À l'étape 4, on ajoutera ici la logique de connexion et de modification du contenu.

document.addEventListener('DOMContentLoaded', () => {

  // ===================== AGRANDISSEMENT DES PHOTOS/VIDÉOS DE PROJETS (lightbox) =====================
  // Comportement voulu :
  //   - Au SURVOL, après 2 secondes d'attente, la lightbox s'ouvre
  //   - Si la souris part avant les 2 secondes, rien ne se passe
  //   - Au CLIC, la lightbox s'ouvre immédiatement
  //   - Se ferme via la croix, un clic sur le fond sombre, ou la touche Échap
  const HOVER_DELAY_MS = 2000;
  const medias = document.querySelectorAll('.projet-media');
  const lightbox = document.getElementById('lightbox');
  const lightboxContent = document.getElementById('lightboxContent');
  const lightboxClose = document.querySelector('.lightbox-close');

  const ouvrirLightbox = (media) => {
    // Tous les médias (photos/vidéos) de CE projet précis, dans l'ordre où ils
    // apparaissent dans le HTML — le premier est la "couverture" de la carte,
    // les suivants ont l'attribut "hidden" et ne servent qu'à la galerie.
    const mediasDuProjet = Array.from(media.querySelectorAll('img, video'));
    if (!mediasDuProjet.length) return; // rien à montrer tant que c'est un placeholder texte

    // On met en pause TOUTES les vidéos de la page avant d'en ouvrir une nouvelle,
    // pour éviter qu'une vidéo regardée juste avant continue en même temps (double son).
    document.querySelectorAll('video').forEach((v) => v.pause());

    lightboxContent.innerHTML = '';

    const zoneAffichage = document.createElement('div');
    zoneAffichage.className = 'lightbox-main';
    lightboxContent.appendChild(zoneAffichage);

    const afficherMedia = (item, index) => {
      zoneAffichage.innerHTML = '';
      const copie = item.cloneNode(true);
      copie.removeAttribute('hidden');
      if (copie.tagName === 'VIDEO') {
        copie.controls = true;
        copie.play();
      }
      zoneAffichage.appendChild(copie);

      // Mettre en évidence la vignette correspondante
      lightboxContent.querySelectorAll('.lightbox-thumb').forEach((v) => v.classList.remove('is-active'));
      const vignette = lightboxContent.querySelector(`[data-index="${index}"]`);
      if (vignette) vignette.classList.add('is-active');
    };

    afficherMedia(mediasDuProjet[0], 0);

    // La bande de vignettes n'apparaît que s'il y a plusieurs médias à montrer
    if (mediasDuProjet.length > 1) {
      const bandeau = document.createElement('div');
      bandeau.className = 'lightbox-thumbs';

      mediasDuProjet.forEach((item, index) => {
        let vignette;
        if (item.tagName === 'VIDEO') {
          // Une vidéo n'a pas de vignette automatique : on affiche un repère simple
          vignette = document.createElement('div');
          vignette.className = 'lightbox-thumb';
          vignette.textContent = '▶';
        } else {
          vignette = document.createElement('img');
          vignette.className = 'lightbox-thumb';
          vignette.src = item.src;
        }
        vignette.dataset.index = index;
        vignette.addEventListener('click', () => afficherMedia(item, index));
        bandeau.appendChild(vignette);
      });

      lightboxContent.appendChild(bandeau);
    }

    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
  };

  const fermerLightbox = () => {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    lightboxContent.innerHTML = ''; // stoppe la vidéo copiée en la retirant de la page
  };

  medias.forEach((media) => {
    let hoverTimer = null;

    media.addEventListener('mouseenter', () => {
      hoverTimer = setTimeout(() => ouvrirLightbox(media), HOVER_DELAY_MS);
    });

    media.addEventListener('mouseleave', () => {
      clearTimeout(hoverTimer);
    });

    media.addEventListener('click', (e) => {
      e.preventDefault(); // empêche le clic de aussi déclencher la lecture native de l'originale
      ouvrirLightbox(media);
    });
  });

  lightboxClose.addEventListener('click', fermerLightbox);

  // Fermer si on clique sur le fond sombre, mais pas si on clique sur l'image elle-même
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) fermerLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') fermerLightbox();
  });

  // ===================== CARROUSEL DES RÉALISATIONS =====================
  // Les flèches font défiler la piste (.projets-grid) d'une largeur de carte à la fois.
  const track = document.getElementById('projetsTrack');
  const prevBtn = document.querySelector('.carousel-prev');
  const nextBtn = document.querySelector('.carousel-next');

  if (track && prevBtn && nextBtn) {
    const CARD_GAP_PX = 32; // doit correspondre au "gap" de .projets-grid en CSS

    const defiler = (direction) => {
      const carte = track.querySelector('.projet-card');
      if (!carte) return;
      const largeurCarte = carte.getBoundingClientRect().width;
      track.scrollBy({ left: direction * (largeurCarte + CARD_GAP_PX), behavior: 'smooth' });
    };

    prevBtn.addEventListener('click', () => defiler(-1));
    nextBtn.addEventListener('click', () => defiler(1));
  }

  // ===================== COMPTEURS ANIMÉS (chiffres clés) =====================
  // Se relancent à chaque fois qu'on entre dans la section, et se réinitialisent à 0
  // quand on la quitte, pour pouvoir recompter au prochain passage.
  const compteurs = document.querySelectorAll('.chiffre-nombre');

  // On garde en mémoire un "numéro de génération" par compteur : si une nouvelle
  // animation démarre avant que l'ancienne soit finie, l'ancienne s'arrête
  // proprement au lieu de continuer à écrire par-dessus la nouvelle.
  const generationParCompteur = new WeakMap();

  const animerCompteur = (el) => {
    const cible = parseInt(el.dataset.target, 10);
    const suffixe = el.dataset.suffix || '';
    const dureeMs = 1500;
    const debut = performance.now();

    const maGeneration = (generationParCompteur.get(el) || 0) + 1;
    generationParCompteur.set(el, maGeneration);

    const etape = (maintenant) => {
      // Une animation plus récente a été lancée entre-temps : on abandonne celle-ci.
      if (generationParCompteur.get(el) !== maGeneration) return;

      const progression = Math.min((maintenant - debut) / dureeMs, 1);
      const progressionAdoucie = 1 - Math.pow(1 - progression, 3);
      el.textContent = Math.round(progressionAdoucie * cible) + suffixe;

      if (progression < 1) {
        requestAnimationFrame(etape);
      }
    };

    requestAnimationFrame(etape);
  };

  if (compteurs.length) {
    const compteurObserver = new IntersectionObserver((entrees) => {
      entrees.forEach((entree) => {
        if (entree.isIntersecting) {
          animerCompteur(entree.target);
        } else {
          // On repart de 0 pour que le comptage soit à nouveau visible au retour.
          entree.target.textContent = '0' + (entree.target.dataset.suffix || '');
        }
      });
    }, { threshold: 0.5 });

    compteurs.forEach((compteur) => compteurObserver.observe(compteur));
  }

  // ===================== APPARITIONS AU DÉFILEMENT (scroll reveal) =====================
  // On sélectionne les éléments qui doivent "apparaître" en douceur, on leur ajoute
  // la classe .reveal (définie en CSS), puis on observe leur passage à l'écran.
  // La classe .reveal-visible est ajoutée ET retirée selon la visibilité :
  // l'animation se rejoue donc à chaque fois qu'on croise l'élément, dans les deux sens.
  const elementsARevele = document.querySelectorAll(
    'section h2, .service-card, .projet-card, .membre-card, .chiffre, .partenaire-logo'
  );

  elementsARevele.forEach((el, index) => {
    el.classList.add('reveal');
    el.style.transitionDelay = `${(index % 4) * 0.08}s`;
  });

  const revealObserver = new IntersectionObserver((entrees) => {
    entrees.forEach((entree) => {
      entree.target.classList.toggle('reveal-visible', entree.isIntersecting);
    });
  }, { threshold: 0.15 });

  elementsARevele.forEach((el) => revealObserver.observe(el));

  // ===================== LIGNES DE SÉPARATION (du centre vers l'extérieur) =====================
  // Même principe que les apparitions ci-dessus : la ligne pousse du milieu vers
  // l'extérieur quand elle entre dans l'écran (voir transform-origin:center en CSS),
  // et se "réécrase" quand elle en sort, pour rejouer l'effet à chaque passage.
  const lignesDeSeparation = document.querySelectorAll('.section-divider');

  const dividerObserver = new IntersectionObserver((entrees) => {
    entrees.forEach((entree) => {
      entree.target.classList.toggle('divider-visible', entree.isIntersecting);
    });
  }, { threshold: 0.5 });

  lignesDeSeparation.forEach((ligne) => dividerObserver.observe(ligne));

  // ===================== FORMULAIRE CONTACT → EMAIL AUTO-RÉDIGÉ (Gmail) =====================
  // Pas de service tiers ici : on lit ce que le visiteur a tapé dans les champs, on
  // construit un lien de compose Gmail (et non un simple "mailto:", qui ouvrirait
  // l'application mail par défaut de l'ordinateur — Outlook, etc. — plutôt que Gmail).
  const contactForm = document.getElementById('contactForm');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault(); // on ne veut pas que le formulaire recharge la page

      const nom = document.getElementById('nom').value;
      const email = document.getElementById('email').value;
      const message = document.getElementById('message').value;

      const sujet = encodeURIComponent(`Nouveau projet - Site Tisserin BTP (${nom})`);
      const corps = encodeURIComponent(
        `Bonjour,\n\n${message}\n\nCordialement,\n${nom}`
      );

      const lienGmail = `https://mail.google.com/mail/?view=cm&fs=1&to=tisserinbtp@gmail.com&su=${sujet}&body=${corps}`;
      window.open(lienGmail, '_blank'); // nouvel onglet, pour ne pas quitter le site

      // Même logique honnête que pour les autres liens d'envoi : on prévient que
      // Gmail va s'ouvrir, sans affirmer à tort que c'est déjà envoyé.
      setTimeout(() => {
        alert('Un nouvel onglet Gmail va s\'ouvrir avec votre message déjà rédigé. Il ne reste plus qu\'à cliquer sur "Envoyer" pour que nous le recevions.');
      }, 300);
    });
  }

  // ===================== CONFIRMATION D'ENVOI (email / WhatsApp) =====================
  // Ces liens ouvrent l'application mail ou WhatsApp du visiteur avec le message prêt ;
  // c'est ensuite à LUI de cliquer sur "Envoyer" dans son application. On ne peut pas
  // vérifier depuis la page que ça a réellement été envoyé, donc le message reste honnête
  // là-dessus plutôt que d'affirmer à tort "message envoyé".
  document.querySelectorAll('.confirm-envoi').forEach((lien) => {
    lien.addEventListener('click', () => {
      // Petit délai : on laisse d'abord le navigateur ouvrir l'appli mail/WhatsApp
      // avant d'afficher l'alerte, sinon elle risque de la bloquer.
      setTimeout(() => {
        alert('Votre application mail ou WhatsApp va s\'ouvrir avec le message prêt. Il ne reste plus qu\'à cliquer sur "Envoyer" pour que nous le recevions.');
      }, 300);
    });
  });

});