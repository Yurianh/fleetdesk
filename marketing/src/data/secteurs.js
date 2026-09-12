// Pages secteur : une entrée = une page /secteurs/<slug>.
// Les secteurs reprennent ceux proposés à l'inscription dans l'app (src/lib/activity.js)
// pour que la promesse marketing et la personnalisation produit restent alignées.
export const SECTEURS = [
  {
    slug: 'transport-routier',
    activity: 'transport',
    nav: 'Transport routier',
    title: 'Gestion de flotte pour le transport routier',
    description: "Licence de transport, FCO, chronotachygraphe, visites techniques annuelles : suivez les échéances d'un parc de transport de marchandises sans rien laisser passer.",
    h1: 'Gérer une flotte de transport routier sans rater une échéance',
    intro: "Licence de transport, qualification des conducteurs, visites techniques annuelles : le transport de marchandises cumule les obligations datées. Une seule oubliée immobilise un véhicule et une tournée.",
    pains: [
      {
        title: 'Une visite technique par an, par véhicule',
        desc: "Les poids lourds passent au contrôle chaque année, avec des visites complémentaires selon le type de véhicule. Sur 20 camions immatriculés à des dates différentes, c'est une échéance toutes les deux ou trois semaines.",
      },
      {
        title: 'La qualification des conducteurs expire',
        desc: "FCO tous les 5 ans, carte de conducteur à renouveler, aptitude médicale à jour, ADR pour les matières dangereuses : un conducteur non à jour ne peut pas prendre la route lundi matin.",
      },
      {
        title: 'La licence de transport se contrôle',
        desc: "Copie conforme à bord, licence rattachée à l'entreprise : ces documents sont demandés en contrôle routier. Ils doivent être retrouvés en quelques secondes, pas cherchés dans une armoire.",
      },
      {
        title: 'Chaque immobilisation coûte une tournée',
        desc: "Dans le transport, un véhicule à l'arrêt n'est pas une gêne : c'est du chiffre d'affaires perdu et un client à prévenir. L'anticipation vaut plus que la réactivité.",
      },
    ],
    modules: [
      'Licence de transport suivie comme un document véhicule, avec sa date de validité',
      'Documents conducteur professionnels : FIMO, FCO, aptitude médicale, ADR',
      'Contrôles techniques annuels et contre-visites, alertés 30 jours avant',
      'Kilométrage saisi par les conducteurs depuis le terrain, preuve à l\'appui',
      'Entretien préventif calé sur le kilométrage réel, pas sur le calendrier',
    ],
    faq: [
      {
        q: "Quels documents un transporteur doit-il suivre pour chaque véhicule ?",
        a: "Le certificat d'immatriculation, l'attestation d'assurance, le procès-verbal de la dernière visite technique et, selon l'activité, la copie conforme de la licence de transport. FleetDesk les stocke par véhicule avec leurs dates de validité.",
      },
      {
        q: "Comment suivre la FCO de mes conducteurs ?",
        a: "En enregistrant la date de la dernière formation continue : l'échéance à 5 ans est calculée automatiquement et remonte dans le centre de conformité avant expiration, conducteur par conducteur.",
      },
      {
        q: "FleetDesk remplace-t-il un TMS ?",
        a: "Non. Un TMS organise les tournées, les commandes et la facturation du transport. FleetDesk gère la vie du parc : documents, échéances réglementaires, entretien, coûts par véhicule. Les deux sont complémentaires.",
      },
    ],
    guides: [
      { title: "Les documents obligatoires du conducteur professionnel", href: '/guides/documents-conducteur' },
      { title: "Contrôle technique : obligations et périodicité", href: '/guides/controle-technique-flotte' },
      { title: "Coût de revient kilométrique : la méthode", href: '/guides/cout-revient-kilometrique' },
    ],
  },
  {
    slug: 'btp',
    activity: 'btp',
    nav: 'BTP et artisans',
    title: 'Gestion de flotte BTP et artisans',
    description: "Utilitaires affectés aux chantiers, entretien à l'usure, documents à jour : suivez un parc BTP ou artisanal sans tableur et sans perdre de temps au bureau.",
    h1: 'Gérer les utilitaires du BTP et des artisans',
    intro: "Des fourgons qui changent de chantier, des conducteurs qui changent de véhicule, un entretien dicté par l'usage réel : un parc de BTP se pilote sur le terrain, pas depuis un tableur ouvert le vendredi soir.",
    pains: [
      {
        title: 'Personne ne sait qui roule avec quoi',
        desc: "Le fourgon parti sur le chantier de mardi revient conduit par quelqu'un d'autre. Sans affectation tracée, impossible de savoir qui utilisait le véhicule le jour d'une amende ou d'un sinistre.",
      },
      {
        title: "L'entretien suit l'usure, pas le calendrier",
        desc: "Un utilitaire chargé, sur pistes et en démarrages permanents, s'use plus vite qu'un véhicule de route. L'entretien doit se déclencher au kilométrage réel, pas à date fixe.",
      },
      {
        title: 'Les kilométrages remontent en retard',
        desc: "Relever les compteurs au retour de chantier n'arrive jamais. Résultat : des révisions déclenchées trop tard et des coûts par véhicule impossibles à comparer.",
      },
      {
        title: 'Les échéances tombent en pleine saison',
        desc: "Un contrôle technique découvert la veille, en pleine période de livraison de chantier, coûte une journée d'équipe entière. L'alerte doit arriver un mois avant.",
      },
    ],
    modules: [
      'Affectations véhicule / conducteur tracées, avec historique',
      'Relevés kilométriques saisis depuis le téléphone, en fin de chantier',
      "Prévisions d'entretien calculées sur le kilométrage réel",
      'Documents véhicule centralisés : carte grise, assurance, contrôle technique',
      'Modules inutiles masqués : pas de licence de transport imposée sur un parc BTP',
    ],
    faq: [
      {
        q: "FleetDesk convient-il à un artisan avec 4 véhicules ?",
        a: "Oui. La formule Starter couvre jusqu'à 5 véhicules et 3 conducteurs, pour 9 € par mois. L'outil est opérationnel en quelques minutes, sans formation ni paramétrage préalable.",
      },
      {
        q: "Peut-on suivre les engins de chantier en plus des utilitaires ?",
        a: "Les véhicules immatriculés se suivent comme n'importe quel véhicule du parc, avec leurs documents et leurs entretiens. Pour les engins non immatriculés, l'usage se limite au suivi d'entretien et de documents libres.",
      },
      {
        q: "Les conducteurs doivent-ils avoir accès à toute la flotte ?",
        a: "Non. Un compte chauffeur ne voit que le véhicule qui lui est affecté et n'accède ni à la facturation ni aux paramètres de l'organisation.",
      },
    ],
    guides: [
      { title: "Gérer un parc automobile sur Excel : jusqu'où ça tient", href: '/guides/gestion-parc-automobile-excel' },
      { title: "Contrôle technique : obligations et périodicité", href: '/guides/controle-technique-flotte' },
      { title: "Carte grise d'un véhicule d'entreprise", href: '/guides/carte-grise-vehicule-entreprise' },
    ],
  },
  {
    slug: 'vtc-taxi',
    activity: 'vtc',
    nav: 'VTC et taxi',
    title: 'Gestion de flotte pour VTC et taxi',
    description: "Contrôle technique annuel, carte professionnelle, visite médicale, propreté des véhicules : gérez une flotte VTC ou taxi et ses chauffeurs sans rien laisser passer.",
    h1: 'Gérer une flotte VTC ou taxi',
    intro: "Transporter des personnes impose un rythme de contrôle plus serré : visite technique annuelle, carte professionnelle à jour, véhicules présentables. Le tout avec des chauffeurs qui ne passent jamais au bureau.",
    pains: [
      {
        title: 'Un contrôle technique chaque année',
        desc: "Les véhicules affectés au transport de personnes — taxis, VTC, VSL — relèvent d'un contrôle technique annuel. Le rythme double par rapport à un véhicule classique, et l'oubli se paie immédiatement.",
      },
      {
        title: 'Les cartes professionnelles expirent',
        desc: "Carte VTC, carte de stationnement pour les taxis, aptitude médicale : ces documents ont une durée de validité. Un chauffeur non à jour ne peut plus travailler, et l'entreprise perd une voiture en exploitation.",
      },
      {
        title: 'Les chauffeurs ne passent jamais au bureau',
        desc: "Relevés de kilométrage, justificatifs de lavage, pleins : demander ces informations par messages fait perdre du temps aux deux côtés. La saisie doit se faire depuis le téléphone, en fin de service.",
      },
      {
        title: "L'état du véhicule fait partie du service",
        desc: "Dans le transport de personnes, la propreté et l'entretien conditionnent la note du client. Le suivi des lavages n'est pas un gadget : c'est un indicateur de qualité de service.",
      },
    ],
    modules: [
      'Contrôles techniques annuels suivis par véhicule, avec alerte anticipée',
      'Documents conducteur : permis, aptitude médicale, attestations professionnelles',
      'Suivi des lavages avec justificatif photo, saisi par le chauffeur',
      'Comptes chauffeur restreints à leur propre véhicule',
      'Coût par véhicule et par course parcourue, pour arbitrer le renouvellement',
    ],
    faq: [
      {
        q: "Les véhicules VTC doivent-ils passer le contrôle technique tous les ans ?",
        a: "Les véhicules affectés au transport de personnes à titre onéreux relèvent d'un régime de contrôle technique annuel. Vérifiez le régime exact applicable à votre activité et à la catégorie inscrite sur la carte grise.",
      },
      {
        q: "Comment récupérer les kilométrages des chauffeurs sans les relancer ?",
        a: "Chaque chauffeur dispose d'un compte restreint : il saisit son kilométrage, ses pleins et ses lavages depuis son téléphone, avec photo du justificatif. Les données remontent directement dans le tableau de bord.",
      },
      {
        q: "Peut-on gérer plusieurs chauffeurs sur un même véhicule ?",
        a: "Oui. Les affectations sont historisées : vous savez qui conduisait quel véhicule et à quelle période, ce qui règle les questions d'amendes et de sinistres.",
      },
    ],
    guides: [
      { title: "Contrôle technique expiré : quelles sanctions ?", href: '/guides/controle-technique-expire-sanctions' },
      { title: "Les documents obligatoires du conducteur professionnel", href: '/guides/documents-conducteur' },
      { title: "Assurance de flotte automobile", href: '/guides/assurance-flotte' },
    ],
  },
  {
    slug: 'vehicules-de-societe',
    activity: 'services',
    nav: 'Véhicules de société',
    title: 'Gérer une flotte de véhicules de société',
    description: "Véhicules de fonction et de service : suivez les affectations, les échéances, les coûts et les documents sans y passer vos journées.",
    h1: 'Gérer une flotte de véhicules de société',
    intro: "Des véhicules attribués à des collaborateurs qui ne sont pas des conducteurs professionnels, répartis sur plusieurs sites, suivis par quelqu'un dont ce n'est pas le métier principal. Le sujet n'est pas technique : il est organisationnel.",
    pains: [
      {
        title: "Le suivi n'est le métier de personne",
        desc: "Office manager, assistant de direction, RH : la flotte s'ajoute à une fiche de poste déjà pleine. Tout ce qui demande une vérification manuelle régulière finit par sauter.",
      },
      {
        title: 'Les véhicules suivent les collaborateurs',
        desc: "Arrivée, départ, changement de poste : les attributions bougent. Sans historique, impossible de dire qui détenait le véhicule lors d'une amende ou d'un sinistre de l'an dernier.",
      },
      {
        title: 'Les coûts sont invisibles',
        desc: "Loyers de location longue durée, carburant, entretien : les lignes sont réparties entre plusieurs factures et personne ne sait ce que coûte réellement un véhicule sur l'année.",
      },
      {
        title: 'Les documents dorment dans les boîtes à gants',
        desc: "Carte grise, attestation d'assurance, constat : ces documents ne sont retrouvés qu'au moment où ils manquent. Une copie numérisée rattachée au véhicule règle le problème.",
      },
    ],
    modules: [
      'Affectations par collaborateur, avec historique complet',
      'Documents véhicule numérisés et rattachés à chaque voiture',
      'Contrôles techniques et échéances d\'assurance alertés à l\'avance',
      'Coûts et utilisation par véhicule, pour préparer les renouvellements',
      'Invitations d\'équipe : plusieurs administrateurs, accès séparés',
    ],
    faq: [
      {
        q: "FleetDesk gère-t-il les véhicules en location longue durée ?",
        a: "Oui. Chaque véhicule peut être suivi quel que soit son mode de financement, avec ses documents, ses échéances et ses coûts d'usage. Le loyer se traite comme une charge fixe du véhicule.",
      },
      {
        q: "Plusieurs personnes peuvent-elles gérer la flotte ?",
        a: "Oui, avec des rôles distincts. Un collaborateur invité saisit les opérations du quotidien sans accéder à la facturation ni aux paramètres de l'organisation.",
      },
      {
        q: "Faut-il installer un boîtier dans les véhicules ?",
        a: "Non. FleetDesk ne nécessite aucun matériel embarqué : les données sont saisies par le gestionnaire ou par les collaborateurs, depuis un navigateur ou un téléphone.",
      },
    ],
    guides: [
      { title: "Coût de revient kilométrique : la méthode", href: '/guides/cout-revient-kilometrique' },
      { title: "Carte grise d'un véhicule d'entreprise", href: '/guides/carte-grise-vehicule-entreprise' },
      { title: "Gérer un parc automobile sur Excel", href: '/guides/gestion-parc-automobile-excel' },
    ],
  },
]
