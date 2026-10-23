(() => {
  "use strict";

  const { questions: qcmQuestions, themes, sources } = window.CIVIC_DATA;
  const officialQuestions = window.OFFICIAL_CIVIC_BANK.questions;
  const situationQuestions = qcmQuestions.filter(q => q.type === "situation");
  const cardQuestions = [...officialQuestions, ...situationQuestions];
  const reviewableQuestions = [...cardQuestions, ...qcmQuestions.filter(q => !cardQuestions.some(card => card.id === q.id))];
  const app = document.querySelector("#app");
  const STORAGE_KEY = "cap-citoyen-progress-v1";
  const EXAM_KEY = "cap-citoyen-active-exam-v1";
  const LETTERS = ["A", "B", "C", "D"];
  let timerId = null;
  let flashSession = null;
  let practiceSession = null;
  let activeUtterance = null;
  let glossaryDataPromise = null;
  let glossaryData = null;

  const sourceUrls = {
    livret: "https://www.legifrance.gouv.fr/download/pdf?id=isr0azgWEe4wSbu_Z-hm_3tIAj0JcaOEDqWIfclQeWk=",
    questions: "https://www.immigration.interieur.gouv.fr/documentation/guides-textes-et-brochures/questions-de-connaissance-pour-lexamen-civique-nationalite-francaise.html",
    arrete: "https://www.legifrance.gouv.fr/loda/id/LEGISCTA000052382278",
    procedure: "https://www.immigration.interieur.gouv.fr/devenir-francais/procedures-dacces-a-nationalite-francaise",
    officialData: "https://www.data.gouv.fr/datasets/examen-civique-naturalisation-questions-de-connaissances-officielles-et-propositions-de-reponses",
    glossaryData: "https://www.data.gouv.fr/datasets/glossaire-de-lexamen-civique-notions-cles-pour-la-naturalisation-et-les-titres-de-sejour"
  };

  const contextNotes = [
    {
      match: /charles de gaulle|général de gaulle|appel à la résistance/i,
      title: "Charles de Gaulle",
      wiki: "Charles_de_Gaulle",
      fr: "Charles de Gaulle (1890–1970) est un général et homme d’État français. Il dirige la France libre pendant la Seconde Guerre mondiale, fonde la Ve République en 1958 et en devient le premier président. Son appel du 18 Juin 1940 symbolise la Résistance.",
      en: "Charles de Gaulle (1890–1970) was a French general and statesman. He led Free France during the Second World War, founded the Fifth Republic in 1958 and became its first president. His Appeal of 18 June 1940 became a symbol of the Resistance."
    },
    {
      match: /simone veil/i,
      title: "Simone Veil",
      wiki: "Simone_Veil",
      fr: "Simone Veil (1927–2017), rescapée de la Shoah, est une femme d’État française. Ministre de la Santé, elle porte la loi de 1975 dépénalisant l’interruption volontaire de grossesse. Elle devient ensuite la première présidente du Parlement européen élu au suffrage universel.",
      en: "Simone Veil (1927–2017), a Holocaust survivor, was a French stateswoman. As Minister of Health, she led the 1975 law decriminalising voluntary termination of pregnancy. She later became the first president of the directly elected European Parliament."
    },
    {
      match: /marie curie/i,
      title: "Marie Curie",
      wiki: "Marie_Curie",
      fr: "Marie Curie (1867–1934) est une physicienne et chimiste d’origine polonaise devenue française. Pionnière des recherches sur la radioactivité, elle est la première femme à recevoir un prix Nobel et la seule personne récompensée dans deux disciplines scientifiques différentes.",
      en: "Marie Curie (1867–1934) was a Polish-born physicist and chemist who became French. A pioneer in research on radioactivity, she was the first woman to receive a Nobel Prize and remains the only person awarded in two different scientific fields."
    },
    {
      match: /napoléon ier|napoléon 1er|code civil/i,
      title: "Napoléon Ier",
      wiki: "Napoléon_Ier",
      fr: "Napoléon Bonaparte devient empereur des Français en 1804. La même année, le Code civil rassemble et organise de nombreuses règles du droit privé. Ce texte a durablement influencé le droit français.",
      en: "Napoleon Bonaparte became Emperor of the French in 1804. That same year, the Civil Code brought together and organised many rules of private law. It had a lasting influence on French law."
    },
    {
      match: /révolution française|prise de la bastille|14 juillet 1789/i,
      title: "Révolution française",
      wiki: "Révolution_française",
      fr: "La Révolution française commence en 1789. Elle met fin à la monarchie absolue et fait émerger des principes majeurs comme la souveraineté nationale, l’égalité devant la loi et les droits de l’homme et du citoyen.",
      en: "The French Revolution began in 1789. It ended absolute monarchy and established major principles such as national sovereignty, equality before the law, and the rights of man and of the citizen."
    },
    {
      match: /shoah|génocide des juifs/i,
      title: "Shoah",
      wiki: "Shoah",
      fr: "La Shoah désigne la persécution et l’extermination systématique d’environ six millions de Juifs d’Europe par l’Allemagne nazie et ses alliés pendant la Seconde Guerre mondiale. Elle constitue un génocide.",
      en: "The Holocaust refers to the persecution and systematic murder of about six million European Jews by Nazi Germany and its allies during the Second World War. It was a genocide."
    },
    {
      match: /marianne|bonnet phrygien/i,
      title: "Marianne",
      wiki: "Marianne",
      fr: "Marianne est la représentation symbolique de la République française. Elle incarne notamment la liberté et la République ; son bonnet phrygien renvoie à l’idée d’émancipation héritée de la Révolution française.",
      en: "Marianne is the symbolic personification of the French Republic. She notably represents liberty and the Republic; her Phrygian cap refers to the idea of emancipation inherited from the French Revolution."
    },
    {
      match: /laïcité|séparation des églises et de l'état/i,
      title: "Laïcité en France",
      wiki: "Laïcité_en_France",
      fr: "La laïcité garantit la liberté de conscience et la neutralité de l’État à l’égard des religions. Elle protège le droit de croire, de ne pas croire ou de changer de religion, dans le respect de la loi et des droits d’autrui.",
      en: "French secularism guarantees freedom of conscience and the State’s neutrality towards religions. It protects the right to believe, not to believe, or to change religion, while respecting the law and the rights of others."
    },
    {
      match: /cinquième république|ve république|constitution de 1958/i,
      title: "Cinquième République",
      wiki: "Cinquième_République_(France)",
      fr: "La Ve République est le régime politique actuel de la France. Elle est fondée par la Constitution du 4 octobre 1958, qui organise les pouvoirs du Président de la République, du Gouvernement et du Parlement.",
      en: "The Fifth Republic is France’s current political system. It was established by the Constitution of 4 October 1958, which organises the powers of the President, the Government and Parliament."
    },
    {
      match: /union européenne|traité de maastricht|citoyenneté européenne/i,
      title: "Union européenne",
      wiki: "Union_européenne",
      fr: "L’Union européenne réunit des États qui exercent ensemble certaines compétences. Le traité de Maastricht, signé en 1992, crée notamment l’Union européenne et la citoyenneté européenne.",
      en: "The European Union brings together countries that exercise certain powers jointly. The Maastricht Treaty, signed in 1992, notably created the European Union and European citizenship."
    },
    {
      match: /sécurité sociale/i,
      title: "Sécurité sociale en France",
      wiki: "Sécurité_sociale_en_France",
      fr: "Créée en 1945, la Sécurité sociale protège la population contre plusieurs risques de la vie, notamment la maladie, la vieillesse, les accidents du travail et les charges liées à la famille.",
      en: "Created in 1945, the French social security system protects people against several life risks, including illness, old age, workplace accidents and family-related costs."
    },
    {
      match: /molière/i,
      title: "Molière",
      wiki: "Molière",
      fr: "Molière (1622–1673) est un dramaturge et comédien majeur du XVIIe siècle. Ses comédies, comme Le Misanthrope ou Le Malade imaginaire, critiquent les travers de la société et occupent une place centrale dans la culture française.",
      en: "Molière (1622–1673) was a major seventeenth-century playwright and actor. His comedies, including The Misanthrope and The Imaginary Invalid, criticise social behaviour and hold a central place in French culture."
    },
    {
      match: /victor hugo/i,
      title: "Victor Hugo",
      wiki: "Victor_Hugo",
      fr: "Victor Hugo (1802–1885) est un écrivain majeur du XIXe siècle et une figure engagée de la vie politique. Auteur notamment des Misérables, il défend la liberté, la justice sociale et l’abolition de la peine de mort.",
      en: "Victor Hugo (1802–1885) was a major nineteenth-century writer and an active political figure. The author of Les Misérables notably defended freedom, social justice and the abolition of the death penalty."
    },
    {
      match: /louis xiv|château de versailles/i,
      title: "Louis XIV",
      wiki: "Louis_XIV",
      fr: "Louis XIV (1638–1715), appelé le Roi-Soleil, incarne la monarchie absolue. Le château de Versailles, où il installe la cour et le gouvernement, devient un symbole durable du pouvoir royal.",
      en: "Louis XIV (1638–1715), known as the Sun King, embodied absolute monarchy. The Palace of Versailles, where he established the royal court and government, became an enduring symbol of royal power."
    },
    {
      match: /eugène delacroix|liberté guidant le peuple/i,
      title: "La Liberté guidant le peuple",
      wiki: "La_Liberté_guidant_le_peuple",
      fr: "Eugène Delacroix peint La Liberté guidant le peuple en 1830 après les Trois Glorieuses. La femme portant le drapeau tricolore est une allégorie de la Liberté, et non le portrait d’une personne réelle.",
      en: "Eugène Delacroix painted Liberty Leading the People in 1830 after the July Revolution. The woman carrying the French tricolour is an allegory of Liberty rather than a portrait of a real person."
    }
  ];

  function pedagogicalNote(q) {
    const singleAnswer = q.answers?.length === 1 ? q.answers[0] : q.choices?.[q.answer] || "";
    const haystack = `${q.q} ${singleAnswer}`;
    return contextNotes.find(item => item.match.test(haystack)) || null;
  }

  function whyExplanation(q) {
    const answer = q.answers?.[0] || q.choices?.[q.answer] || "";
    const text = `${q.q} ${answer}`;
    const detailedRules = [
      {
        ids: ["official-1"],
        fr: "« Le jour de gloire est arrivé » ouvre le premier couplet de La Marseillaise. Rouget de Lisle compose ce chant de guerre en 1792 ; il devient ensuite l’hymne national, ce qui explique que ses premiers vers soient un repère civique.",
        en: "“The day of glory has arrived” opens the first verse of La Marseillaise. Rouget de Lisle composed this war song in 1792; it later became the national anthem, which is why its opening lines are a civic landmark."
      },
      {
        ids: ["official-10", "official-18"],
        fr: "La devise « Liberté, Égalité, Fraternité » résume les idéaux républicains. Avec le drapeau, La Marseillaise, Marianne, le 14 Juillet et la langue française, elle forme un ensemble de symboles qui rendent la République reconnaissable.",
        en: "The motto “Liberty, Equality, Fraternity” sums up republican ideals. Together with the flag, La Marseillaise, Marianne, 14 July and the French language, it forms a set of symbols that makes the Republic recognisable."
      },
      {
        ids: ["official-23", "t1-s02", "t1-s06", "t1-s08", "t3-s04"],
        fr: "L’égalité interdit de traiter différemment deux personnes placées dans une situation comparable en raison de leur origine, sexe, religion, grossesse ou d’un autre critère protégé. Elle s’applique aussi bien aux services publics qu’à l’emploi.",
        en: "Equality forbids treating two people in comparable situations differently because of origin, sex, religion, pregnancy or another protected characteristic. It applies to public services as well as employment."
      },
      {
        ids: ["official-78"],
        fr: "Le Défenseur des droits est une autorité indépendante que l’on peut saisir notamment en cas de discrimination ou de difficulté avec un service public. Son indépendance lui permet d’enquêter, de recommander des solutions et de faire respecter les droits.",
        en: "The Defender of Rights is an independent authority that may notably be contacted in cases of discrimination or difficulties with a public service. Its independence allows it to investigate, recommend solutions and uphold rights."
      },
      {
        ids: ["official-25", "official-30", "official-35", "official-36"],
        fr: "La laïcité sépare les institutions publiques des religions : l’État n’impose ni ne privilégie aucun culte. Cette neutralité rend possible l’égalité des usagers et protège simultanément le droit de croire, de ne pas croire ou de changer de religion.",
        en: "French secularism separates public institutions from religions: the State neither imposes nor favours any faith. This neutrality makes equal treatment possible while protecting the right to believe, not believe or change religion."
      },
      {
        ids: ["official-28", "official-34"],
        fr: "La loi du 9 décembre 1905 établit le cadre historique de la séparation des Églises et de l’État. Elle garantit la liberté de conscience et pose le principe selon lequel la République ne reconnaît ni ne subventionne aucun culte, sous les réserves prévues par le droit.",
        en: "The law of 9 December 1905 established the historic framework for separating churches and the State. It guarantees freedom of conscience and states that the Republic neither recognises nor subsidises any religion, subject to legal exceptions."
      },
      {
        ids: ["official-31"],
        fr: "La Journée de la laïcité est fixée au 9 décembre parce qu’elle commémore la promulgation de la loi de séparation des Églises et de l’État du 9 décembre 1905.",
        en: "Secularism Day is held on 9 December because it commemorates the enactment of the law separating churches and the State on 9 December 1905."
      },
      {
        ids: ["official-32"],
        fr: "Dans les écoles publiques, les élèves ne peuvent porter de signes manifestant ostensiblement une appartenance religieuse. Un signe discret reste admis : la règle cherche à préserver un cadre scolaire commun sans supprimer la liberté de conscience.",
        en: "In state schools, pupils may not wear symbols that conspicuously display religious affiliation. A discreet symbol remains permitted: the rule seeks to preserve a shared school environment without removing freedom of conscience."
      },
      {
        ids: ["official-37"],
        fr: "La Charte de la laïcité explique aux élèves, aux familles et aux personnels comment la laïcité s’applique concrètement à l’école. Elle transforme un principe constitutionnel en règles compréhensibles pour la vie scolaire.",
        en: "The Secularism Charter explains to pupils, families and staff how secularism applies in practice at school. It translates a constitutional principle into understandable rules for school life."
      },
      {
        ids: ["official-41", "official-45", "official-46", "official-50", "official-51", "official-72"],
        fr: "Les règles électorales distinguent voter et être candidat. Le vote national exige notamment la nationalité française, la majorité, les droits civiques et l’inscription ; une candidature ajoute ses propres conditions, comme les 500 présentations d’élus pour l’élection présidentielle.",
        en: "Electoral rules distinguish voting from standing as a candidate. Voting nationally notably requires French nationality, adulthood, civic rights and registration; candidacy adds its own conditions, such as 500 endorsements from elected officials for the presidential election."
      },
      {
        ids: ["official-43", "official-67"],
        fr: "Aux élections municipales, les citoyens élisent les conseillers municipaux, pas directement le maire. Une fois installé, le conseil municipal élit le maire parmi ses membres.",
        en: "In municipal elections, citizens elect municipal councillors, not the mayor directly. Once constituted, the municipal council elects the mayor from among its members."
      },
      {
        ids: ["official-44", "official-49"],
        fr: "L’inscription sur une liste électorale rattache l’électeur à un bureau de vote et permet de vérifier qu’il ne vote qu’une fois. Sans internet, la démarche reste possible auprès de la mairie ou par courrier.",
        en: "Registration on an electoral roll assigns a voter to a polling station and ensures that each person votes only once. Without internet access, registration can still be completed at the town hall or by post."
      },
      {
        ids: ["official-53", "official-58", "official-60"],
        fr: "Les députés sont élus directement lors des élections législatives, normalement pour cinq ans. Ils représentent la Nation à l’Assemblée nationale, où ils votent la loi et contrôlent le Gouvernement.",
        en: "Members of the National Assembly are directly elected in legislative elections, normally for five years. They represent the Nation, pass laws and scrutinise the Government."
      },
      {
        ids: ["official-54"],
        fr: "Le Parlement, composé de l’Assemblée nationale et du Sénat, examine et vote les lois. Le Gouvernement peut proposer des textes, mais il ne se confond pas avec l’autorité législative qui les adopte.",
        en: "Parliament, made up of the National Assembly and Senate, examines and passes laws. The Government may introduce bills, but it is distinct from the legislative authority that adopts them."
      },
      {
        ids: ["official-69"],
        fr: "La Constitution est la norme suprême ; sa modification suit donc une procédure plus exigeante qu’une loi ordinaire. Après un vote identique des deux chambres, la révision peut notamment être approuvée directement par les citoyens lors d’un référendum.",
        en: "The Constitution is the supreme legal norm, so changing it requires a stricter process than ordinary legislation. After both chambers adopt identical wording, a revision may notably be approved directly by citizens in a referendum."
      },
      {
        ids: ["official-86"],
        fr: "La citoyenneté européenne permet à un citoyen de l’Union résidant dans un autre État membre d’y voter et d’être candidat aux élections municipales et européennes, dans les mêmes conditions générales que les nationaux.",
        en: "European citizenship allows an EU citizen living in another member state to vote and stand in municipal and European elections there, under the same general conditions as nationals."
      },
      {
        ids: ["official-131"],
        fr: "La privation des droits civiques retire temporairement la possibilité de participer à la vie politique, notamment de voter ou d’être candidat. Elle doit être prononcée par un juge comme peine complémentaire et pour une durée déterminée.",
        en: "Loss of civic rights temporarily removes the ability to participate in political life, notably to vote or stand for election. It must be imposed by a judge as an additional penalty for a specified period."
      },
      {
        ids: ["official-138"],
        fr: "Ministre de la Santé et rescapée de la Shoah, Simone Veil défend devant le Parlement la loi de 1975 dépénalisant l’interruption volontaire de grossesse. Son action en fait une figure majeure des droits des femmes et de la construction européenne.",
        en: "A Holocaust survivor and Minister of Health, Simone Veil defended the 1975 law decriminalising abortion before Parliament. Her work made her a major figure in women’s rights and European integration."
      },
      {
        ids: ["official-149"],
        fr: "Depuis la révision constitutionnelle de 1962, le Président de la République est choisi directement par les électeurs. Avant cette réforme, il était élu par un collège électoral.",
        en: "Since the 1962 constitutional reform, the President of the Republic has been chosen directly by voters. Before that reform, the President was elected by an electoral college."
      },
      {
        ids: ["official-161"],
        fr: "L’ordonnance de 1944 reconnaît aux Françaises le droit de voter et d’être élues. Elles l’exercent pour la première fois en 1945, mettant fin à leur exclusion de la citoyenneté politique.",
        en: "The 1944 ordinance granted French women the right to vote and stand for election. They exercised it for the first time in 1945, ending their exclusion from political citizenship."
      },
      {
        ids: ["official-254"],
        fr: "Les représentants de parents participent aux conseils de l’école ou de l’établissement et transmettent les préoccupations des familles. Chaque parent peut voter et, sous les conditions prévues, se porter candidat.",
        en: "Parent representatives take part in school councils and convey families’ concerns. Every parent may vote and, subject to the applicable conditions, stand as a candidate."
      },
      {
        ids: ["official-40"],
        fr: "La Constitution donne au Président de la République le pouvoir de nommer le Premier ministre. Celui-ci forme et dirige ensuite le Gouvernement, qui reste politiquement responsable devant l’Assemblée nationale.",
        en: "The Constitution gives the President of the Republic the power to appoint the Prime Minister. The Prime Minister then forms and leads the Government, which remains politically accountable to the National Assembly."
      },
      {
        ids: ["official-47", "official-59"],
        fr: "Le Président est élu directement par les citoyens français pour cinq ans, ce qui le distingue des autorités nommées comme le préfet ou le Premier ministre. Cette durée est appelée le quinquennat.",
        en: "The President is elected directly by French citizens for five years, unlike appointed authorities such as the prefect or Prime Minister. This term is known as the quinquennat."
      },
      {
        ids: ["official-76"],
        fr: "Le Président est le chef de l’État : il veille au respect de la Constitution, garantit la continuité des institutions et représente la France. Il ne dirige toutefois pas seul toute la politique nationale, qui relève du Gouvernement.",
        en: "The President is head of state: safeguarding the Constitution, ensuring institutional continuity and representing France. The President does not, however, single-handedly direct all national policy, which is the Government’s responsibility."
      },
      {
        ids: ["official-61"],
        fr: "Les sénateurs sont élus pour six ans au suffrage indirect et représentent les collectivités territoriales. Le renouvellement partiel du Sénat contribue à la continuité de cette chambre.",
        en: "Senators are indirectly elected for six years and represent local authorities. Partial renewal of the Senate contributes to the chamber’s continuity."
      },
      {
        ids: ["official-70"],
        fr: "Le président du Sénat assure provisoirement la continuité de la fonction présidentielle en cas de vacance. Ce choix place l’intérim entre les mains de la deuxième personnalité institutionnelle de l’État jusqu’à une nouvelle élection.",
        en: "The President of the Senate temporarily ensures continuity of the presidency if the office becomes vacant. This places the interim in the hands of the State’s second-ranking institutional figure until a new election."
      },
      {
        ids: ["official-85", "official-93"],
        fr: "Les députés européens sont élus directement par les citoyens des États membres et siègent au Parlement européen. Ils votent les textes européens avec le Conseil de l’Union et contrôlent politiquement la Commission.",
        en: "Members of the European Parliament are directly elected by citizens of member states and sit in the European Parliament. They pass EU legislation with the Council and politically scrutinise the Commission."
      },
      {
        ids: ["official-48"],
        fr: "Le maire exerce deux types de fonctions : il dirige la commune et agit aussi au nom de l’État pour certaines missions. C’est à ce second titre qu’il est officier d’état civil et célèbre les mariages ; il dispose aussi de pouvoirs de police municipale.",
        en: "The mayor performs two types of role: leading the municipality and acting on behalf of the State for certain duties. In the latter capacity the mayor is a civil registrar and celebrates marriages, while also holding municipal policing powers."
      },
      {
        ids: ["official-136"],
        fr: "La Constitution du 4 octobre 1958 fonde la Ve République afin de renforcer la stabilité des institutions. Elle organise encore aujourd’hui les rapports entre le Président, le Gouvernement et le Parlement.",
        en: "The Constitution of 4 October 1958 founded the Fifth Republic to strengthen institutional stability. It still governs relations between the President, Government and Parliament today."
      },
      {
        ids: ["official-215", "official-220", "official-221"],
        fr: "La déclaration à la mairie du lieu de naissance permet à l’officier d’état civil d’établir l’acte de naissance. Le délai de cinq jours garantit que l’enfant possède rapidement une identité juridique et peut exercer ses droits.",
        en: "Declaring a birth at the town hall of the place of birth allows the civil registrar to draw up the birth certificate. The five-day deadline ensures that the child quickly acquires a legal identity and can exercise rights."
      },
      {
        ids: ["official-217"],
        fr: "Seul le mariage civil célébré par un officier d’état civil crée des effets juridiques pour les époux. Une cérémonie religieuse est facultative et ne peut avoir lieu qu’après la cérémonie civile.",
        en: "Only a civil marriage celebrated by a civil registrar creates legal effects for spouses. A religious ceremony is optional and may take place only after the civil ceremony."
      },
      {
        ids: ["official-225", "official-227", "official-249"],
        fr: "L’autorité parentale rassemble les droits et devoirs destinés à protéger, éduquer et entretenir l’enfant. Une séparation ou un divorce ne la supprime pas : les deux parents continuent en principe à l’exercer, sauf décision contraire du juge.",
        en: "Parental authority brings together the rights and duties used to protect, educate and support a child. Separation or divorce does not end it: both parents generally continue to exercise it unless a judge decides otherwise."
      },
      {
        ids: ["official-224", "official-247", "official-248", "official-250", "official-251", "official-252", "official-255", "official-256"],
        fr: "L’instruction est obligatoire de 3 à 16 ans afin que chaque enfant accède aux apprentissages essentiels. La mairie organise l’inscription dans le public, l’école accueille aussi les élèves allophones ou handicapés et seules des absences légitimes, comme la maladie, sont admises.",
        en: "Education is compulsory from ages 3 to 16 so every child has access to essential learning. The municipality organises state-school enrolment, schools also accommodate non-French-speaking or disabled pupils, and only legitimate absences such as illness are accepted."
      },
      {
        ids: ["official-258"],
        fr: "L’autorité parentale doit protéger et éduquer l’enfant sans violence physique ni psychologique. Une punition corporelle porte atteinte à sa dignité et n’est donc pas un moyen éducatif autorisé.",
        en: "Parental authority must protect and educate a child without physical or psychological violence. Corporal punishment infringes the child’s dignity and is therefore not a permitted educational method."
      },
      {
        ids: ["official-12"],
        fr: "Créée en 1945 dans le contexte de la Libération, la Sécurité sociale organise une solidarité nationale face à la maladie, la vieillesse, les accidents du travail et les charges familiales.",
        en: "Created in 1945 in the context of the Liberation, Social Security organises national solidarity in response to illness, old age, workplace accidents and family costs."
      },
      {
        ids: ["official-228", "official-231", "official-232", "official-233", "official-234"],
        fr: "L’Assurance Maladie couvre une part des frais de santé : la carte Vitale transmet les droits, la CPAM gère les remboursements et le tiers payant évite d’avancer la part couverte. Une mutuelle peut compléter le reste.",
        en: "Health Insurance covers part of healthcare costs: the Vitale card transmits entitlement, the local health fund manages reimbursement and third-party payment avoids advancing the covered share. Supplementary insurance may cover the remainder."
      },
      {
        ids: ["official-95"],
        fr: "La grève est une cessation collective et concertée du travail destinée à soutenir des revendications professionnelles. Ce caractère collectif la distingue d’une simple absence individuelle et explique sa protection comme droit.",
        en: "A strike is a collective, coordinated stoppage of work intended to support employment-related demands. Its collective nature distinguishes it from an individual absence and explains its protection as a right."
      },
      {
        ids: ["official-237"],
        fr: "Le SMIC fixe un plancher légal de rémunération afin qu’un salarié ne puisse être payé en dessous d’un minimum horaire. Il est revalorisé selon des règles nationales et ne doit pas être confondu avec le salaire moyen.",
        en: "The minimum wage sets a legal pay floor so an employee cannot be paid below a minimum hourly rate. It is adjusted under national rules and must not be confused with average pay."
      },
      {
        ids: ["official-240", "official-257"],
        fr: "Les congés liés à la naissance permettent aux parents de s’occuper de l’enfant tout en encadrant la suspension du travail. Le congé parental peut être demandé par le père ou la mère sous conditions ; le congé de paternité et d’accueil dure 28 jours depuis 2021.",
        en: "Birth-related leave allows parents to care for a child while regulating time away from work. Parental leave may be requested by either parent subject to conditions; paternity and child-welcome leave has lasted 28 days since 2021."
      },
      {
        ids: ["official-246"],
        fr: "La grossesse ne peut pas justifier un licenciement : cette protection évite une discrimination liée à la maternité. La loi prévoit seulement des exceptions sans rapport avec la grossesse, dans des conditions strictes.",
        en: "Pregnancy cannot justify dismissal: this protection prevents maternity-related discrimination. The law provides only strict exceptions unrelated to pregnancy."
      },
      {
        ids: ["official-109"],
        fr: "L’assistance d’un avocat après une interpellation protège les droits de la défense. L’avocat explique la procédure, vérifie le respect des garanties légales et conseille la personne avant ou pendant ses auditions.",
        en: "Access to a lawyer after arrest protects defence rights. The lawyer explains the procedure, checks that legal safeguards are respected and advises the person before or during questioning."
      },
      {
        ids: ["official-222", "official-223"],
        fr: "Les numéros spécialisés orientent immédiatement vers le bon service : le 17 pour Police secours ou la gendarmerie, le 15 pour l’urgence médicale et le SAMU. Le 112 reste le numéro d’urgence utilisable dans toute l’Union européenne.",
        en: "Specialised numbers immediately reach the appropriate service: 17 for the police or gendarmerie and 15 for medical emergencies and the SAMU. 112 remains the emergency number available throughout the European Union."
      },
      {
        ids: ["official-134", "official-148"],
        fr: "Les lois portées par Jules Ferry en 1881 et 1882 rendent l’école primaire publique gratuite, obligatoire et laïque. Elles cherchent à donner à tous les enfants un socle commun d’instruction indépendamment de leur milieu ou de leur religion.",
        en: "The laws promoted by Jules Ferry in 1881 and 1882 made public primary education free, compulsory and secular. They aimed to give every child a common educational foundation regardless of background or religion."
      },
      {
        ids: ["official-114"],
        fr: "La solidarité transforme l’appartenance à la collectivité en actes : cotiser et payer l’impôt financent les protections communes, tandis que porter secours répond à une urgence individuelle. Dans les deux cas, chacun contribue à protéger les autres.",
        en: "Solidarity turns membership of society into action: contributions and taxes fund shared protections, while assisting someone addresses an individual emergency. In both cases, each person helps protect others."
      },
      {
        ids: ["official-2"],
        fr: "Un entretien d’embauche doit servir à vérifier l’aptitude au poste. Les questions doivent donc avoir un lien direct avec les compétences, l’expérience ou les contraintes du travail ; la vie privée et les critères discriminatoires n’ont pas à intervenir.",
        en: "A job interview is meant to assess suitability for the position. Questions must therefore relate directly to skills, experience or job requirements; private life and discriminatory criteria must not come into play."
      },
      {
        ids: ["official-7", "official-8", "official-9", "official-13", "official-14", "official-16", "official-22"],
        fr: "Les symboles rendent la République identifiable dans la vie publique. Marianne personnifie la République et la liberté, le drapeau représente la Nation, la devise figure sur les bâtiments publics et le 14 Juillet rappelle l’héritage révolutionnaire.",
        en: "Symbols make the Republic recognisable in public life. Marianne personifies the Republic and liberty, the flag represents the Nation, the motto appears on public buildings, and 14 July recalls the revolutionary heritage."
      },
      {
        ids: ["official-11"],
        fr: "Le drapeau est un emblème national protégé. La critique politique reste libre, mais sa destruction publique dans certaines circonstances peut constituer un outrage puni par la loi : ce sont l’acte et son contexte qui sont sanctionnés.",
        en: "The flag is a protected national emblem. Political criticism remains free, but publicly destroying it in certain circumstances may amount to an offence punishable by law: the act and its context are what matter."
      },
      {
        ids: ["official-15"],
        fr: "La fraternité complète la liberté et l’égalité en rappelant que la République repose aussi sur la solidarité. Elle invite chacun à reconnaître l’autre comme un égal et à contribuer à la vie collective malgré les différences.",
        en: "Fraternity complements liberty and equality by recalling that the Republic also rests on solidarity. It calls on everyone to recognise others as equals and contribute to collective life despite differences."
      },
      {
        ids: ["official-17"],
        fr: "La devise européenne associe deux idées : les États et les peuples coopèrent dans une même Union, tout en conservant leurs langues, leurs cultures et leurs traditions. L’unité n’efface donc pas la diversité.",
        en: "The European motto combines two ideas: states and peoples cooperate within one Union while retaining their languages, cultures and traditions. Unity therefore does not erase diversity."
      },
      {
        ids: ["official-20"],
        fr: "Une liberté autorise chacun à choisir et à agir, mais elle s’arrête lorsque son exercice porte atteinte aux droits d’autrui ou à l’ordre public. C’est pourquoi les libertés sont garanties et encadrées à la fois.",
        en: "A freedom allows everyone to choose and act, but it ends where its exercise infringes another person’s rights or public order. This is why freedoms are both guaranteed and regulated."
      },
      {
        ids: ["official-21", "official-99"],
        fr: "Ces quatre caractères définissent l’organisation de la République : un même droit sur tout le territoire, la neutralité religieuse de l’État, le pouvoir issu des citoyens et la recherche de solidarité et de justice sociale.",
        en: "These four characteristics define the Republic: one legal order throughout the territory, State neutrality towards religion, authority derived from citizens, and a commitment to solidarity and social justice."
      },
      {
        ids: ["official-26", "t1-s03"],
        fr: "La neutralité religieuse s’impose aux agents qui représentent le service public, pas de la même manière aux usagers. Un usager peut en principe porter un signe religieux tant qu’il respecte l’ordre public et le bon fonctionnement du service.",
        en: "Religious neutrality applies to officials who represent the public service, not in the same way to users. A user may generally wear a religious symbol provided that public order and the proper operation of the service are respected."
      },
      {
        ids: ["official-27"],
        fr: "Financer la conservation d’un monument religieux classé protège un élément du patrimoine historique ; cela ne revient pas à financer l’exercice d’un culte. La finalité patrimoniale explique cette possibilité.",
        en: "Funding the conservation of a listed religious building protects historical heritage; it is not the same as funding religious worship. The heritage purpose explains why this is permitted."
      },
      {
        ids: ["official-33"],
        fr: "L’antisémitisme désigne spécifiquement l’hostilité, les préjugés ou les discriminations visant les Juifs. Employer le terme précis permet de nommer et de combattre cette forme particulière de racisme.",
        en: "Antisemitism specifically means hostility, prejudice or discrimination directed at Jewish people. Using the precise term helps identify and combat this particular form of racism."
      },
      {
        ids: ["official-38", "t1-s01"],
        fr: "Un agent public agit au nom de l’administration. Son obligation de neutralité garantit que chaque usager est accueilli de la même manière, sans que les convictions personnelles de l’agent influencent le service rendu.",
        en: "A public official acts on behalf of the administration. The duty of neutrality ensures that every user is treated equally and that the official’s personal beliefs do not influence the service provided."
      },
      {
        ids: ["official-39"],
        fr: "Être athée signifie ne croire en aucun dieu. Cette position est protégée par la liberté de conscience au même titre que le fait de croire ou de changer de religion.",
        en: "Being an atheist means not believing in any god. This position is protected by freedom of conscience just like believing in, or changing, a religion."
      },
      {
        ids: ["t1-s05"],
        fr: "La liberté d’association permet de se réunir autour d’un projet commun sans autorisation générale préalable. L’association doit toutefois poursuivre un objet licite et respecter les lois applicables.",
        en: "Freedom of association allows people to join together around a common project without general prior authorisation. The association must nevertheless have a lawful purpose and comply with applicable law."
      },
      {
        ids: ["official-42"],
        fr: "Dans une démocratie, le pouvoir politique tire sa légitimité des citoyens. Le peuple exerce cette souveraineté par ses représentants élus et, dans certains cas, directement par référendum.",
        en: "In a democracy, political authority derives its legitimacy from citizens. The people exercise sovereignty through elected representatives and, in some cases, directly by referendum."
      },
      {
        ids: ["official-55"],
        fr: "Séparer les pouvoirs évite qu’une seule autorité fasse la loi, l’applique et juge les conflits. L’exécutif gouverne, le législatif vote la loi et le judiciaire tranche les litiges de manière indépendante.",
        en: "Separating powers prevents one authority from making the law, enforcing it and judging disputes. The executive governs, the legislature passes laws and the judiciary settles disputes independently."
      },
      {
        ids: ["official-57"],
        fr: "Les électeurs choisissent les conseillers municipaux pour six ans ; ceux-ci élisent ensuite le maire parmi eux. Le maire et le conseil appartiennent donc au même cycle municipal.",
        en: "Voters elect municipal councillors for six years, and those councillors then elect the mayor from among themselves. The mayor and council therefore share the same municipal term."
      },
      {
        ids: ["official-63"],
        fr: "Le pluralisme politique est nécessaire au débat démocratique. Chacun peut adhérer au parti de son choix ou n’adhérer à aucun, à condition que les partis respectent les principes de la souveraineté nationale et de la démocratie.",
        en: "Political pluralism is necessary for democratic debate. Everyone may join the party of their choice or none at all, provided parties respect national sovereignty and democracy."
      },
      {
        ids: ["official-64"],
        fr: "La police recherche les auteurs et le procureur engage les poursuites, mais seule une juridiction peut déclarer une personne coupable et prononcer une peine. Cette répartition protège les droits de la défense.",
        en: "The police investigate and the prosecutor brings proceedings, but only a court may find someone guilty and impose a sentence. This division protects defence rights."
      },
      {
        ids: ["official-65", "official-66", "official-68"],
        fr: "La décentralisation répartit les services de proximité entre collectivités : la commune gère notamment les écoles maternelles et élémentaires, le département les collèges, et la région les lycées et les transports régionaux.",
        en: "Decentralisation divides local services between authorities: municipalities notably manage nursery and primary schools, departments manage lower secondary schools, and regions manage upper secondary schools and regional transport."
      },
      {
        ids: ["official-73", "official-74", "official-75"],
        fr: "Le territoire est organisé en communes, départements et régions. Les collectivités ont leurs élus et compétences propres, tandis que le préfet représente l’État et veille à l’application des politiques nationales dans le département.",
        en: "The territory is organised into municipalities, departments and regions. Local authorities have their own elected representatives and powers, while the prefect represents the State and oversees national policy in the department."
      },
      {
        ids: ["official-79", "official-88", "official-89", "official-150"],
        fr: "Le traité de Maastricht, signé en 1992, transforme la coopération européenne en Union européenne et crée la citoyenneté européenne. Il marque donc une étape institutionnelle majeure, même si la construction européenne avait commencé auparavant.",
        en: "The Maastricht Treaty, signed in 1992, transformed European cooperation into the European Union and created European citizenship. It was therefore a major institutional step, although European integration had begun earlier."
      },
      {
        ids: ["official-80", "official-87", "official-90"],
        fr: "L’Union compte 27 États : la Croatie en est le membre le plus récent depuis 2013, tandis que le Royaume-Uni l’a quittée en 2020. Ces deux événements expliquent le nombre actuel de membres.",
        en: "The Union has 27 member states: Croatia has been the newest member since 2013, while the United Kingdom left in 2020. These two events explain the current total."
      },
      {
        ids: ["official-81", "official-91"],
        fr: "L’hymne européen reprend le thème de l’Ode à la joie de la Neuvième Symphonie de Beethoven. Il est utilisé sans paroles officielles afin de symboliser un idéal commun au-delà des langues nationales.",
        en: "The European anthem uses the Ode to Joy theme from Beethoven’s Ninth Symphony. It has no official lyrics, so it can symbolise a shared ideal beyond national languages."
      },
      {
        ids: ["official-82"],
        fr: "Le 9 mai rappelle la déclaration Schuman du 9 mai 1950, qui proposait de mettre en commun la production de charbon et d’acier. Cette initiative est considérée comme un point de départ de la construction européenne.",
        en: "9 May commemorates the Schuman Declaration of 9 May 1950, which proposed pooling coal and steel production. This initiative is regarded as a starting point for European integration."
      },
      {
        ids: ["official-83", "official-84", "official-94"],
        fr: "Les institutions européennes ne sont pas toutes installées dans la même ville : la Banque centrale européenne est à Francfort, la Commission principalement à Bruxelles et le siège officiel du Parlement à Strasbourg.",
        en: "European institutions are not all located in one city: the European Central Bank is in Frankfurt, the Commission mainly in Brussels, and Parliament’s official seat in Strasbourg."
      },
      {
        ids: ["official-92"],
        fr: "Les douze étoiles du drapeau européen symbolisent l’unité, la solidarité et l’harmonie. Leur nombre est fixe : il ne correspond pas au nombre d’États membres.",
        en: "The twelve stars on the European flag symbolise unity, solidarity and harmony. Their number is fixed and does not correspond to the number of member states."
      },
      {
        ids: ["official-96", "official-98"],
        fr: "Les libertés peuvent être limitées seulement pour protéger d’autres droits ou des besoins collectifs comme la sécurité et l’ordre public. La restriction doit être prévue par la loi et rester nécessaire et proportionnée au but recherché.",
        en: "Freedoms may be restricted only to protect other rights or collective needs such as safety and public order. A restriction must be provided by law and remain necessary and proportionate to its aim."
      },
      {
        ids: ["official-97", "official-105", "official-106"],
        fr: "Adoptée pendant la Révolution française, la Déclaration de 1789 affirme des droits universels et l’égalité devant la loi. Elle fait encore partie des normes constitutionnelles auxquelles les lois françaises doivent se conformer.",
        en: "Adopted during the French Revolution, the 1789 Declaration states universal rights and equality before the law. It still forms part of the constitutional standards with which French laws must comply."
      },
      {
        ids: ["official-100"],
        fr: "Une presse libre permet au public d’être informé, de confronter les opinions et de contrôler l’action des pouvoirs. Elle est indispensable au débat démocratique, tout en restant soumise aux lois protégeant les personnes.",
        en: "A free press enables the public to be informed, compare opinions and scrutinise those in power. It is essential to democratic debate while remaining subject to laws protecting individuals."
      },
      {
        ids: ["official-101"],
        fr: "La liberté de circulation permet de choisir où se déplacer et séjourner, sous réserve des règles légales. La citoyenneté européenne étend cette possibilité aux autres États de l’Union selon des conditions communes.",
        en: "Freedom of movement allows people to choose where to travel and stay, subject to legal rules. European citizenship extends this possibility to other EU states under common conditions."
      },
      {
        ids: ["official-102"],
        fr: "La citoyenneté rattache juridiquement une personne à un État par la nationalité. Ce lien ouvre des droits politiques, comme voter, et implique des devoirs, comme respecter la loi et contribuer à la vie collective.",
        en: "Citizenship legally connects a person to a state through nationality. This link grants political rights, such as voting, and entails duties, such as obeying the law and contributing to collective life."
      },
      {
        ids: ["official-103", "official-104"],
        fr: "Les droits fondamentaux protègent la liberté, l’égalité, la dignité et la sûreté de toute personne. Le droit à la sûreté interdit notamment qu’une autorité prive quelqu’un de liberté sans base légale ni garanties judiciaires.",
        en: "Fundamental rights protect every person’s liberty, equality, dignity and security. The right to security notably prevents authorities from depriving someone of liberty without a legal basis and judicial safeguards."
      },
      {
        ids: ["official-107"],
        fr: "Faire travailler une personne sans la rémunérer nie la valeur de son travail et peut relever de l’exploitation. La dignité humaine interdit de traiter une personne comme un simple moyen ou de lui imposer des conditions dégradantes.",
        en: "Making someone work without pay denies the value of their labour and may amount to exploitation. Human dignity forbids treating a person merely as a means or imposing degrading conditions."
      },
      {
        ids: ["official-111"],
        fr: "À partir de 15 ans, un mineur peut consentir seul au traitement de ses données pour certains services en ligne. Avant cet âge, l’accord conjoint du mineur et du titulaire de l’autorité parentale est requis.",
        en: "From age 15, a minor may consent alone to the processing of personal data for certain online services. Before that age, the joint consent of the minor and the holder of parental authority is required."
      },
      {
        ids: ["official-112"],
        fr: "L’interdiction de fumer protège les autres de la fumée dans les lieux fermés accueillant du public ou servant de lieux de travail. La rue est un espace ouvert, même si certaines zones extérieures peuvent faire l’objet d’interdictions particulières.",
        en: "Smoking bans protect others from smoke in enclosed public places and workplaces. A street is an open space, although specific outdoor areas may be subject to particular bans."
      },
      {
        ids: ["official-113", "official-120", "t3-s02"],
        fr: "Le permis atteste que le conducteur maîtrise les règles et le véhicule ; le code de la route protège tous les usagers. Conduire sans permis ou enfreindre ces règles expose donc à des sanctions, même sans accident.",
        en: "A driving licence certifies that the driver can handle the vehicle and knows the rules; the highway code protects all road users. Driving without a licence or breaking those rules therefore carries penalties even if no accident occurs."
      },
      {
        ids: ["official-115"],
        fr: "Le droit français repose sur le mariage entre deux personnes seulement. Tant qu’un premier mariage n’est pas dissous par divorce ou décès, un nouveau mariage ne peut pas être célébré.",
        en: "French law provides for marriage between two people only. Until a first marriage is ended by divorce or death, another marriage cannot be celebrated."
      },
      {
        ids: ["official-117", "t3-s05"],
        fr: "La solidarité devient ici une obligation juridique : lorsqu’une aide est possible sans danger pour soi ou pour autrui, il faut agir directement ou appeler les secours. Ne rien faire peut constituer une non-assistance à personne en danger.",
        en: "Solidarity becomes a legal duty here: when help can be given without danger to oneself or others, one must act directly or call emergency services. Doing nothing may constitute failure to assist a person in danger."
      },
      {
        ids: ["official-118", "official-124", "official-130", "t3-s03"],
        fr: "La cour d’assises associe des citoyens tirés au sort aux magistrats pour juger les crimes. Une convocation comme juré est donc un devoir civique ; seule une dispense ou un motif grave reconnu permet de ne pas siéger.",
        en: "The assize court brings randomly selected citizens together with professional judges to try serious crimes. A jury summons is therefore a civic duty; only an exemption or an accepted serious reason permits absence."
      },
      {
        ids: ["official-119"],
        fr: "La vente d’alcool aux mineurs est interdite pour protéger leur santé et leur développement. Le seuil de 18 ans correspond à la majorité civile, mais le vendeur doit aussi vérifier l’âge en cas de doute.",
        en: "Selling alcohol to minors is prohibited to protect their health and development. The age of 18 corresponds to civil majority, and a seller must verify age when in doubt."
      },
      {
        ids: ["official-121", "official-127"],
        fr: "Les infractions sont classées par gravité : contraventions, délits puis crimes. Un crime, comme le viol, est jugé le plus sévèrement et peut entraîner des peines complémentaires, dont la privation temporaire de certains droits civiques.",
        en: "Offences are classified by seriousness: minor offences, misdemeanours and then crimes. A crime such as rape is punished most severely and may carry additional penalties, including temporary loss of certain civic rights."
      },
      {
        ids: ["official-122"],
        fr: "La carte nationale d’identité certifie l’identité et la nationalité françaises de son titulaire. Une personne étrangère utilise les titres d’identité ou de séjour correspondant à sa propre situation.",
        en: "The national identity card certifies its holder’s identity and French nationality. A foreign national uses the identity or residence documents appropriate to their own situation."
      },
      {
        ids: ["official-125"],
        fr: "À 18 ans, une personne devient juridiquement capable d’exercer seule ses droits civils : conclure un contrat, agir en justice ou administrer ses biens. Cet âge ouvre aussi le droit de vote aux citoyens français.",
        en: "At 18, a person becomes legally capable of exercising civil rights independently: entering contracts, taking legal action or managing property. This age also opens voting rights to French citizens."
      },
      {
        ids: ["official-128"],
        fr: "Être citoyen dans l’espace numérique signifie exercer ses libertés tout en protégeant les données, la sécurité et les droits d’autrui. Il faut notamment vérifier l’information, respecter les personnes et maîtriser les traces laissées en ligne.",
        en: "Digital citizenship means exercising freedoms online while protecting data, security and other people’s rights. It notably involves checking information, respecting others and managing the traces left online."
      },
      {
        ids: ["official-129"],
        fr: "Le devoir de mémoire entretient la connaissance des persécutions, guerres et crimes du passé. Comprendre leurs causes et leurs conséquences aide à honorer les victimes et à prévenir leur répétition.",
        en: "The duty of remembrance preserves knowledge of past persecution, wars and crimes. Understanding their causes and consequences helps honour victims and prevent repetition."
      },
      {
        ids: ["t3-s07"],
        fr: "Une déclaration préremplie reste sous la responsabilité du contribuable. Il doit contrôler les informations, les corriger si nécessaire et valider la déclaration dans les délais.",
        en: "A pre-filled tax return remains the taxpayer’s responsibility. The information must be checked, corrected if necessary and submitted on time."
      },
      {
        ids: ["official-132", "official-143"],
        fr: "Napoléon Bonaparte devient empereur en 1804, année où le Code civil est promulgué. Ce code unifie une grande partie du droit privé après la Révolution et marque durablement l’organisation juridique française.",
        en: "Napoleon Bonaparte became emperor in 1804, the year the Civil Code was enacted. The code unified much of private law after the Revolution and had a lasting effect on French legal organisation."
      },
      {
        ids: ["official-135", "official-142"],
        fr: "Le 14 juillet renvoie à deux moments révolutionnaires : la prise de la Bastille en 1789, symbole de la chute de l’absolutisme, et la Fête de la Fédération de 1790, symbole d’unité nationale.",
        en: "14 July refers to two revolutionary moments: the storming of the Bastille in 1789, symbolising the fall of absolutism, and the 1790 Festival of the Federation, symbolising national unity."
      },
      {
        ids: ["official-137", "official-155"],
        fr: "L’Italie fait partie des six pays à l’origine de la construction européenne. En 1951, la CECA met en commun le charbon et l’acier afin de rendre une nouvelle guerre entre anciens adversaires matériellement plus difficile.",
        en: "Italy was one of the six countries at the origin of European integration. In 1951, the ECSC pooled coal and steel to make another war between former adversaries materially more difficult."
      },
      {
        ids: ["official-139"],
        fr: "Le 6 juin 1944, les forces alliées débarquent sur plusieurs plages de Normandie. Cette opération ouvre un front décisif à l’ouest et permet d’engager la libération de la France occupée.",
        en: "On 6 June 1944, Allied forces landed on several beaches in Normandy. This operation opened a decisive western front and began the liberation of occupied France."
      },
      {
        ids: ["official-140"],
        fr: "Reims est associée au sacre des rois parce que Clovis y aurait été baptisé et que la Sainte Ampoule y était conservée. La cathédrale devient ainsi le lieu traditionnel du couronnement royal.",
        en: "Reims is associated with royal coronations because Clovis was traditionally said to have been baptised there and the Holy Ampulla was kept there. Its cathedral therefore became the traditional coronation site."
      },
      {
        ids: ["official-141"],
        fr: "Louis XVI est renversé pendant la Révolution, jugé par la Convention nationale puis exécuté en 1793. Sa mort marque la rupture avec la monarchie et l’installation de la République.",
        en: "Louis XVI was overthrown during the Revolution, tried by the National Convention and executed in 1793. His death marked the break with monarchy and the establishment of the Republic."
      },
      {
        ids: ["official-147"],
        fr: "L’Algérie a été conquise puis colonisée par la France à partir de 1830, avant de devenir indépendante en 1962 après une guerre. Cette histoire explique les liens humains et mémoriels importants entre les deux pays.",
        en: "Algeria was conquered and colonised by France from 1830, before becoming independent in 1962 after a war. This history explains the important human and memorial ties between the two countries."
      },
      {
        ids: ["official-151", "official-154", "official-164"],
        fr: "La Seconde Guerre mondiale se déroule de 1939 à 1945. Paris est libérée le 25 août 1944, puis la capitulation allemande du 8 mai 1945 met fin à la guerre en Europe, date commémorée chaque année en France.",
        en: "The Second World War lasted from 1939 to 1945. Paris was liberated on 25 August 1944, and Germany’s surrender on 8 May 1945 ended the war in Europe, a date commemorated annually in France."
      },
      {
        ids: ["official-152", "official-157"],
        fr: "La Première Guerre mondiale se déroule de 1914 à 1918. L’armistice signé le 11 novembre 1918 arrête les combats ; cette date rend aujourd’hui hommage aux morts pour la France.",
        en: "The First World War lasted from 1914 to 1918. The armistice signed on 11 November 1918 stopped the fighting; the date now honours those who died for France."
      },
      {
        ids: ["official-153"],
        fr: "La peine de mort est abolie en 1981 sous la présidence de François Mitterrand, à l’initiative du garde des Sceaux Robert Badinter. L’abolition affirme que l’État ne doit plus exécuter une personne condamnée.",
        en: "The death penalty was abolished in 1981 under President François Mitterrand, on the initiative of Justice Minister Robert Badinter. Abolition affirms that the State must no longer execute a convicted person."
      },
      {
        ids: ["official-156"],
        fr: "Jean Moulin est envoyé par le général de Gaulle pour coordonner les mouvements de Résistance intérieure. Il contribue à leur union au sein du Conseil national de la Résistance en 1943.",
        en: "Jean Moulin was sent by General de Gaulle to coordinate internal Resistance movements. He helped unite them within the National Council of the Resistance in 1943."
      },
      {
        ids: ["official-158", "official-159", "official-165", "official-166"],
        fr: "La traite et l’esclavage ont enrichi des ports comme Nantes tout en réduisant des millions de personnes en servitude. Des penseurs des Lumières les dénoncent, puis le décret de 1848, porté notamment par Victor Schœlcher, abolit définitivement l’esclavage dans les colonies françaises.",
        en: "The slave trade and slavery enriched ports such as Nantes while reducing millions of people to servitude. Enlightenment thinkers denounced them, and the 1848 decree, notably promoted by Victor Schœlcher, definitively abolished slavery in the French colonies."
      },
      {
        ids: ["official-160"],
        fr: "La loi de 1881 rend l’école primaire publique gratuite ; les lois Ferry complètent ensuite cette réforme par l’obligation et la laïcité. Le but est que l’accès à l’instruction ne dépende plus des ressources ou de la religion de la famille.",
        en: "The 1881 law made public primary school free; the Ferry laws then completed the reform with compulsory and secular education. The aim was to ensure that access to education no longer depended on family income or religion."
      },
      {
        ids: ["official-162"],
        fr: "L’ONU est créée en 1945 pour organiser la coopération internationale après les destructions de la guerre. Sa Charte vise notamment à maintenir la paix, défendre les droits humains et résoudre les différends entre États.",
        en: "The United Nations was founded in 1945 to organise international cooperation after the destruction of war. Its Charter notably aims to maintain peace, defend human rights and resolve disputes between states."
      },
      {
        ids: ["official-163"],
        fr: "L’euro existe pour les paiements scripturaux depuis 1999, mais les pièces et billets remplacent le franc en 2002. C’est cette mise en circulation qui en fait la monnaie utilisée quotidiennement en France.",
        en: "The euro existed for non-cash payments from 1999, but coins and banknotes replaced the franc in 2002. This introduction made it the currency used in everyday life in France."
      },
      {
        ids: ["official-168", "official-175", "official-188", "official-191"],
        fr: "Ces peintres appartiennent aux grands repères de l’art français moderne : Monet et Renoir sont des figures de l’impressionnisme, tandis que Cézanne ouvre la voie à de nouvelles manières de construire les formes et l’espace.",
        en: "These painters are major landmarks of modern French art: Monet and Renoir are leading Impressionists, while Cézanne opened the way to new ways of constructing form and space."
      },
      {
        ids: ["official-169"],
        fr: "Le pot-au-feu est un plat traditionnel composé de viande de bœuf et de légumes cuits lentement dans un bouillon. Sa présence durable dans les foyers et les livres de cuisine en fait un repère du patrimoine culinaire français.",
        en: "Pot-au-feu is a traditional dish of beef and vegetables slowly cooked in broth. Its enduring place in homes and cookbooks makes it a landmark of French culinary heritage."
      },
      {
        ids: ["official-172", "official-192"],
        fr: "Le Louvre est un ancien palais royal devenu musée. Il conserve des collections majeures de l’Antiquité au XIXe siècle, dont la Joconde de Léonard de Vinci.",
        en: "The Louvre is a former royal palace turned museum. It houses major collections from antiquity to the nineteenth century, including Leonardo da Vinci’s Mona Lisa."
      },
      {
        ids: ["official-174"],
        fr: "La grotte de Lascaux, en Dordogne, conserve des peintures réalisées il y a environ 20 000 ans. La grotte originale est protégée ; des reproductions permettent au public de découvrir cet art préhistorique.",
        en: "Lascaux Cave in Dordogne preserves paintings made around 20,000 years ago. The original cave is protected, and replicas allow the public to discover this prehistoric art."
      },
      {
        ids: ["official-176"],
        fr: "Les Journées européennes du patrimoine ouvrent chaque année de nombreux monuments et lieux parfois habituellement fermés. La gratuité fréquente facilite l’accès de tous au patrimoine.",
        en: "European Heritage Days open many monuments and places to the public each year, including some normally closed. Frequent free admission makes heritage more accessible to everyone."
      },
      {
        ids: ["official-177"],
        fr: "Le 1er mai est lié aux luttes ouvrières pour la réduction du temps de travail. En France, c’est la Fête du Travail et un jour férié ; le muguet en est devenu un symbole populaire.",
        en: "1 May is linked to workers’ struggles for shorter working hours. In France it is Labour Day and a public holiday; lily of the valley has become a popular symbol of the day."
      },
      {
        ids: ["official-178"],
        fr: "Rouget de Lisle compose en 1792 le Chant de guerre pour l’armée du Rhin. Repris par des volontaires marseillais, ce chant devient La Marseillaise puis l’hymne national français.",
        en: "Rouget de Lisle composed the War Song for the Army of the Rhine in 1792. Adopted by volunteers from Marseille, it became La Marseillaise and later the French national anthem."
      },
      {
        ids: ["official-179"],
        fr: "La tour Eiffel est construite comme attraction majeure de l’Exposition universelle de 1889, organisée pour le centenaire de la Révolution française. Prévue comme temporaire, elle devient un symbole durable de Paris et de la France.",
        en: "The Eiffel Tower was built as a major attraction for the 1889 World’s Fair, held for the centenary of the French Revolution. Intended to be temporary, it became a lasting symbol of Paris and France."
      },
      {
        ids: ["official-180", "official-181"],
        fr: "Les frontières terrestres françaises suivent en partie de grands reliefs : les Pyrénées au sud-ouest avec l’Espagne et les Alpes au sud-est avec l’Italie. Associer chaque massif au pays voisin évite de les inverser.",
        en: "French land borders partly follow major mountain ranges: the Pyrenees in the south-west with Spain and the Alps in the south-east with Italy. Linking each range to its neighbouring country helps avoid confusion."
      },
      {
        ids: ["official-183", "official-184", "official-185", "official-186", "official-187"],
        fr: "Ces auteurs illustrent plusieurs périodes de la littérature et de la pensée françaises : Baudelaire et George Sand au XIXe siècle, puis Beauvoir, Camus et Yourcenar au XXe siècle. Leurs œuvres abordent notamment la liberté, la société et la condition humaine.",
        en: "These authors represent several periods of French literature and thought: Baudelaire and George Sand in the nineteenth century, then Beauvoir, Camus and Yourcenar in the twentieth. Their work notably explores freedom, society and the human condition."
      },
      {
        ids: ["official-189", "official-190"],
        fr: "Auguste Rodin renouvelle la sculpture à la fin du XIXe siècle par des œuvres expressives comme Le Penseur. Claude Debussy renouvelle la musique française par ses harmonies et ses couleurs sonores ; chacun est un repère majeur de son art.",
        en: "Auguste Rodin renewed sculpture in the late nineteenth century through expressive works such as The Thinker. Claude Debussy renewed French music through his harmonies and tone colours; each is a major figure in his art."
      },
      {
        ids: ["official-193"],
        fr: "Le Mont-Saint-Michel est bâti sur un îlot rocheux normand entouré par de fortes marées. Son abbaye médiévale et sa situation exceptionnelle en font un monument majeur du patrimoine français.",
        en: "Mont-Saint-Michel is built on a rocky Norman tidal island. Its medieval abbey and exceptional setting make it a major monument of French heritage."
      },
      {
        ids: ["official-194", "official-209", "official-210", "official-211"],
        fr: "Paris est la principale métropole française. Lyon, Rennes et Marseille sont respectivement les chefs-lieux d’Auvergne-Rhône-Alpes, de Bretagne et de Provence-Alpes-Côte d’Azur : un chef-lieu accueille les principales institutions régionales.",
        en: "Paris is France’s leading metropolitan area. Lyon, Rennes and Marseille are respectively the capitals of Auvergne-Rhône-Alpes, Brittany and Provence-Alpes-Côte d’Azur; a regional capital hosts the main regional institutions."
      },
      {
        ids: ["official-195", "official-196", "official-198", "official-203", "official-204", "official-208", "official-212"],
        fr: "La France comprend des territoires européens et ultramarins : la Corse est en Méditerranée, la Martinique et la Guadeloupe dans les Antilles, La Réunion dans l’océan Indien, et Mayotte est devenue département en 2011. L’outre-mer désigne les territoires situés hors de la France métropolitaine.",
        en: "France includes European and overseas territories: Corsica is in the Mediterranean, Martinique and Guadeloupe in the Caribbean, Réunion in the Indian Ocean, and Mayotte became a department in 2011. Overseas France means territories outside metropolitan France."
      },
      {
        ids: ["official-197", "official-213"],
        fr: "Le Mont Blanc, dans les Alpes, est le plus haut sommet de France. Le relief alpin explique aussi la forte présence de stations de ski en Auvergne-Rhône-Alpes.",
        en: "Mont Blanc in the Alps is the highest summit in France. Alpine terrain also explains the large number of ski resorts in Auvergne-Rhône-Alpes."
      },
      {
        ids: ["official-199", "official-200"],
        fr: "La Guyane est un territoire français d’Amérique du Sud : elle partage une frontière terrestre avec le Brésil. Le Centre spatial guyanais se trouve à Kourou, près de l’équateur, une position favorable au lancement des fusées Ariane.",
        en: "French Guiana is a French territory in South America and shares a land border with Brazil. The Guiana Space Centre is at Kourou near the equator, a favourable location for launching Ariane rockets."
      },
      {
        ids: ["official-201", "official-202", "official-214"],
        fr: "La France métropolitaine est bordée par plusieurs mers : la Méditerranée au sud et la Manche entre la France et l’Angleterre. À l’intérieur du pays, la Seine traverse Paris avant de rejoindre la Manche.",
        en: "Metropolitan France borders several seas: the Mediterranean to the south and the English Channel between France and England. Within the country, the Seine flows through Paris before reaching the Channel."
      },
      {
        ids: ["official-205", "official-207"],
        fr: "Les ordres de grandeur permettent de situer le pays : la France compte environ 68 millions d’habitants et 13 régions métropolitaines. Il faut distinguer la métropole de l’ensemble du territoire, qui comprend aussi les régions ultramarines.",
        en: "Orders of magnitude help place the country: France has about 68 million inhabitants and 13 metropolitan regions. Metropolitan France must be distinguished from the whole territory, which also includes overseas regions."
      },
      {
        ids: ["official-206"],
        fr: "Marseille-Fos est le premier port français par le volume de marchandises. Sa façade méditerranéenne le relie aux grandes routes maritimes entre l’Europe, l’Asie et l’Afrique.",
        en: "Marseille-Fos is France’s leading port by cargo volume. Its Mediterranean location connects it to major sea routes between Europe, Asia and Africa."
      },
      {
        ids: ["official-216"],
        fr: "Le locataire peut aménager et décorer le logement sans en modifier la structure ou la destination. Les transformations importantes exigent l’accord du propriétaire, contrairement à une peinture ou un revêtement facilement réversible.",
        en: "A tenant may arrange and decorate a home without changing its structure or purpose. Major alterations require the owner’s consent, unlike painting or another readily reversible finish."
      },
      {
        ids: ["official-218"],
        fr: "Ces places sont conçues pour compenser les difficultés de déplacement et rapprocher les personnes handicapées de leur destination. La carte mobilité inclusion permet d’identifier les bénéficiaires autorisés à les utiliser.",
        en: "These spaces are designed to compensate for mobility difficulties and bring disabled people closer to their destination. The mobility inclusion card identifies those authorised to use them."
      },
      {
        ids: ["official-219"],
        fr: "La garantie légale de conformité oblige le vendeur professionnel à livrer un bien qui fonctionne comme prévu. En cas de défaut couvert, le consommateur peut demander en priorité sa réparation ou son remplacement.",
        en: "The legal guarantee of conformity requires a professional seller to supply goods that work as expected. For a covered defect, the consumer may primarily request repair or replacement."
      },
      {
        ids: ["official-226"],
        fr: "L’aide juridictionnelle prend en charge tout ou partie des frais de justice lorsque les ressources sont insuffisantes. Elle rend effectif le droit d’accéder à un juge et d’être défendu, quelle que soit sa situation financière.",
        en: "Legal aid covers all or part of legal costs when a person has insufficient means. It makes the right of access to a court and legal representation effective regardless of financial circumstances."
      },
      {
        ids: ["official-229", "official-235"],
        fr: "La contraception et l’interruption volontaire de grossesse relèvent de l’autonomie corporelle et de la santé. La loi garantit l’accès à la contraception, y compris aux mineures, et la liberté de recourir à l’IVG est protégée par la Constitution.",
        en: "Contraception and voluntary termination of pregnancy concern bodily autonomy and health. The law guarantees access to contraception, including for minors, and the freedom to obtain an abortion is protected by the Constitution."
      },
      {
        ids: ["official-230"],
        fr: "Le secret médical permet au patient de parler librement aux professionnels de santé et protège sa vie privée. Les informations ne peuvent être partagées que dans les cas prévus par la loi ou nécessaires à la prise en charge.",
        en: "Medical confidentiality allows patients to speak freely to health professionals and protects privacy. Information may be shared only where the law permits it or where necessary for care."
      },
      {
        ids: ["official-236"],
        fr: "Déclarer le travail permet le paiement des cotisations et ouvre des droits à l’assurance maladie, à la retraite ou au chômage. Le travail dissimulé prive le salarié de protections et soustrait l’employeur à ses obligations.",
        en: "Declaring work ensures that contributions are paid and creates rights to healthcare, pensions or unemployment protection. Undeclared work deprives workers of safeguards and allows employers to evade their duties."
      },
      {
        ids: ["official-238"],
        fr: "France Travail centralise l’accompagnement des demandeurs d’emploi : inscription, offres, orientation, formation et, selon la situation, indemnisation. L’inscription permet donc d’ouvrir un parcours de recherche structuré.",
        en: "France Travail centralises support for jobseekers: registration, vacancies, guidance, training and, depending on circumstances, benefits. Registering therefore opens a structured job-search pathway."
      },
      {
        ids: ["official-239"],
        fr: "Les 35 heures constituent la durée légale hebdomadaire d’un temps complet, utilisée notamment pour calculer les heures supplémentaires. Elles ne sont pas une durée maximale absolue : des dépassements encadrés sont possibles.",
        en: "Thirty-five hours is the statutory weekly duration of full-time work and is notably used to calculate overtime. It is not an absolute maximum, as regulated additional hours are possible."
      },
      {
        ids: ["official-241", "official-242"],
        fr: "La liberté d’entreprendre et le principe d’égalité permettent aux femmes comme aux étrangers en situation régulière de créer une entreprise. Des conditions liées au titre de séjour ou à une profession réglementée peuvent toutefois s’appliquer.",
        en: "Freedom of enterprise and equality allow women and lawfully resident foreign nationals to create a business. Conditions linked to residence status or a regulated profession may nevertheless apply."
      },
      {
        ids: ["official-243", "official-244", "official-245"],
        fr: "Le Code du travail fixe les règles générales, les conventions collectives les adaptent au secteur et le règlement intérieur organise l’entreprise. En cas de litige individuel, le conseil de prud’hommes tranche ; les syndicats défendent collectivement les intérêts des travailleurs.",
        en: "The Labour Code sets general rules, collective agreements adapt them to an industry, and internal rules organise the workplace. Employment tribunals decide individual disputes, while trade unions collectively defend workers’ interests."
      },
      {
        ids: ["official-253"],
        fr: "Le collège constitue le premier cycle de l’enseignement secondaire après l’école élémentaire. Les élèves y suivent de la sixième à la troisième avant de poursuivre généralement au lycée ou en formation professionnelle.",
        en: "Lower secondary school is the first stage of secondary education after primary school. Pupils attend from sixième to troisième before generally continuing to upper secondary school or vocational training."
      }
    ];
    const detailed = detailedRules.find(rule => rule.ids.includes(q.id));
    if (detailed) return detailed;
    const rules = [
      {
        match: /laïcité|séparation.*églises|doit rester neutre.*religion|neutralité de l['’]état|neutralité.*religion/i,
        fr: "La laïcité oblige l’État, ses administrations et ses agents à ne favoriser ni défavoriser aucune religion. Cette neutralité garantit à chaque usager un traitement égal et protège sa liberté de conscience.",
        en: "French secularism requires the State, its administrations and public officials neither to favour nor disadvantage any religion. This neutrality ensures equal treatment for every user and protects freedom of conscience."
      },
      {
        match: /liberté d['’]expression|réseaux sociaux|diffamation|incit.*haine/i,
        fr: "La liberté d’expression est fondamentale, mais elle s’exerce dans les limites fixées par la loi. Ces limites protègent notamment les personnes contre la diffamation, les menaces et l’incitation à la haine ou à la violence.",
        en: "Freedom of expression is fundamental, but it must be exercised within the limits set by law. These limits notably protect people against defamation, threats, and incitement to hatred or violence."
      },
      {
        match: /liberté d['’]association|association loi|créer.*association/i,
        fr: "Cette liberté permet aux personnes de se réunir autour d’un projet commun sans demander une autorisation préalable générale. La loi encadre toutefois l’objet et le fonctionnement des associations.",
        en: "This freedom allows people to join together around a shared project without needing general prior authorisation. The law nevertheless regulates the purpose and operation of associations."
      },
      {
        match: /changer.*religion|liberté de conscience|croire.*ne pas croire/i,
        fr: "La liberté de conscience protège les convictions personnelles. L’État ne peut imposer une religion : chacun peut croire, ne pas croire ou changer de religion, dans le respect de l’ordre public et des droits d’autrui.",
        en: "Freedom of conscience protects personal beliefs. The State cannot impose a religion: everyone may believe, not believe, or change religion while respecting public order and the rights of others."
      },
      {
        match: /impôt|impôts|services fiscaux|déclarer ses revenus/i,
        fr: "L’impôt finance les services et politiques publics, comme l’école, la santé, la justice ou la sécurité. La déclaration permet à l’administration de calculer la contribution de chacun selon les règles communes.",
        en: "Taxes fund public services and policies such as schools, healthcare, justice and security. Declaring income allows the administration to calculate each person’s contribution under common rules."
      },
      {
        match: /égalité|discrimination|mêmes droits|égalité devant la loi/i,
        fr: "Le principe d’égalité impose que la loi et les services publics traitent les personnes selon les mêmes règles, sauf différence de situation objectivement justifiée. Il interdit les discriminations fondées notamment sur l’origine, le sexe, la religion ou le handicap.",
        en: "The principle of equality requires the law and public services to treat people under the same rules unless an objectively justified difference in situation applies. It prohibits discrimination based notably on origin, sex, religion or disability."
      },
      {
        match: /état de droit|respect.*loi|au-dessus de la loi/i,
        fr: "Dans un État de droit, les citoyens comme les pouvoirs publics sont soumis aux règles juridiques. Des juges indépendants peuvent contrôler les décisions et protéger les droits fondamentaux.",
        en: "Under the rule of law, both citizens and public authorities are subject to legal rules. Independent judges can review decisions and protect fundamental rights."
      },
      {
        match: /vote|élection|suffrage|électeur|liste électorale/i,
        fr: "Le vote permet aux citoyens de choisir leurs représentants et de participer à la souveraineté nationale. Ses règles cherchent à garantir un choix libre, personnel, égal et secret.",
        en: "Voting allows citizens to choose their representatives and take part in national sovereignty. Its rules aim to guarantee a free, personal, equal and secret choice."
      },
      {
        match: /conseil constitutionnel/i,
        fr: "Le Conseil constitutionnel vérifie notamment que les lois respectent la Constitution. Ce contrôle empêche qu’une loi ordinaire porte atteinte aux règles et droits placés au sommet de l’ordre juridique français.",
        en: "The Constitutional Council notably checks that laws comply with the Constitution. This review prevents ordinary legislation from violating the rules and rights at the top of the French legal order."
      },
      {
        match: /assemblée nationale|député|députés/i,
        fr: "Les députés représentent la Nation à l’Assemblée nationale. Ils votent les lois, contrôlent l’action du Gouvernement et peuvent mettre en cause sa responsabilité.",
        en: "Members of the National Assembly represent the Nation. They pass laws, scrutinise the Government and may hold it politically accountable."
      },
      {
        match: /sénat|sénateur|sénateurs/i,
        fr: "Le Sénat participe au vote des lois avec l’Assemblée nationale et représente les collectivités territoriales. Cette seconde chambre contribue à l’examen et à la continuité du travail législatif.",
        en: "The Senate passes laws together with the National Assembly and represents local authorities. This second chamber contributes to legislative scrutiny and continuity."
      },
      {
        match: /président de la république/i,
        fr: "Le Président de la République veille au respect de la Constitution et au fonctionnement régulier des pouvoirs publics. Il dispose de compétences propres, tandis que le Gouvernement conduit la politique de la Nation.",
        en: "The President of the Republic safeguards the Constitution and the proper functioning of public authorities. The President has specific powers, while the Government determines and conducts national policy."
      },
      {
        match: /premier ministre|gouvernement/i,
        fr: "Le Gouvernement détermine et conduit la politique de la Nation. Le Premier ministre dirige son action et assure l’exécution des lois, sous le contrôle du Parlement.",
        en: "The Government determines and conducts national policy. The Prime Minister directs its work and ensures that laws are implemented, under parliamentary scrutiny."
      },
      {
        match: /école.*obligatoire|instruction obligatoire|lois scolaires|jules ferry/i,
        fr: "L’instruction obligatoire vise à garantir à tous les enfants l’accès aux connaissances nécessaires à leur autonomie et à leur citoyenneté. La gratuité et la laïcité de l’école publique soutiennent l’égalité d’accès.",
        en: "Compulsory education aims to give every child the knowledge needed for independence and citizenship. Free and secular state education supports equal access."
      },
      {
        match: /sécurité sociale|assurance maladie|carte vitale|tiers payant/i,
        fr: "La protection sociale mutualise les cotisations et contributions afin de prendre en charge collectivement certains risques, comme la maladie, la vieillesse ou les charges familiales. Elle facilite ainsi l’accès aux soins et à la solidarité nationale.",
        en: "Social protection pools contributions to cover risks collectively, including illness, old age and family costs. It therefore supports access to healthcare and national solidarity."
      },
      {
        match: /contrat de travail|smic|licenci|congé|grève|syndicat/i,
        fr: "Le droit du travail cherche à équilibrer la relation entre employeur et salarié. Il fixe des protections minimales et encadre les droits collectifs afin que l’activité professionnelle respecte la dignité et la sécurité de chacun.",
        en: "Employment law seeks to balance the relationship between employer and employee. It sets minimum protections and regulates collective rights so that working life respects everyone’s dignity and safety."
      },
      {
        match: /mariage|divorce|autorité parentale|enfant|naissance/i,
        fr: "Le droit de la famille organise les liens entre les personnes et protège particulièrement l’intérêt de l’enfant. Les démarches d’état civil donnent une existence juridique aux événements importants de la vie familiale.",
        en: "Family law organises relationships between people and gives particular protection to the child’s best interests. Civil-status procedures give legal recognition to major events in family life."
      },
      {
        match: /police|gendarmerie|samu|pompiers|numéro d['’]urgence/i,
        fr: "Les numéros d’urgence orientent rapidement l’appel vers le service compétent. Les connaître permet de gagner du temps et de transmettre les informations utiles lorsqu’une personne ou la sécurité publique est en danger.",
        en: "Emergency numbers quickly direct a call to the appropriate service. Knowing them saves time and helps provide useful information when a person or public safety is at risk."
      }
    ];
    const specific = rules.find(rule => rule.match.test(text));
    if (specific) return specific;
    const contextual = contextNotes.find(item => item.match.test(text));
    if (contextual) return { fr: contextual.fr, en: contextual.en };
    const fallbacks = {
      t1: {
        fr: "Ce repère aide à comprendre comment les valeurs républicaines se traduisent concrètement dans les règles communes et dans le fonctionnement des services publics.",
        en: "This fact helps explain how republican values are put into practice through common rules and the operation of public services."
      },
      t2: {
        fr: "Cette distinction est importante car chaque institution possède des compétences précises. Les confondre conduit souvent à attribuer une décision au mauvais niveau de pouvoir.",
        en: "This distinction matters because each institution has specific powers. Confusing them often means attributing a decision to the wrong level of authority."
      },
      t3: {
        fr: "Ce principe recherche un équilibre entre la liberté individuelle, la protection des autres et le respect des règles communes applicables à tous.",
        en: "This principle seeks a balance between individual freedom, the protection of others, and common rules that apply to everyone."
      },
      t4: {
        fr: "Ce repère permet de replacer la réponse dans l’histoire ou le patrimoine commun. Comprendre son contexte évite de mémoriser isolément un simple nom ou une simple date.",
        en: "This fact places the answer within shared history or heritage. Understanding its context avoids memorising an isolated name or date."
      },
      t5: {
        fr: "Cette règle répond à une situation concrète de la vie en France. Elle indique quel droit, quel service ou quelle démarche utiliser dans la vie quotidienne.",
        en: "This rule addresses a practical situation in life in France. It identifies the right, service or procedure to use in everyday life."
      }
    };
    return fallbacks[q.theme] || fallbacks.t3;
  }

  function commonTrap(q) {
    const answer = q.answers?.[0] || q.choices?.[q.answer] || "";
    const text = `${q.q} ${answer}`;
    const rules = [
      {
        match: /laïcité|neutralité.*religion|signe religieux/i,
        fr: "Ne confondez pas la neutralité des services et agents publics avec la situation des usagers. Les agents représentent le service public et sont soumis à une obligation de neutralité ; les usagers disposent en principe de leur liberté religieuse, dans les limites nécessaires au bon fonctionnement du service.",
        en: "Do not confuse the neutrality required of public services and officials with the position of service users. Officials represent the public service and must remain neutral; users generally retain religious freedom, within the limits required for the service to operate properly."
      },
      {
        match: /assemblée nationale|sénat|parlement|député|sénateur/i,
        fr: "Ne confondez pas Parlement, Gouvernement et Président de la République. Le Parlement réunit l’Assemblée nationale et le Sénat ; il vote la loi et contrôle le Gouvernement.",
        en: "Do not confuse Parliament, the Government and the President of the Republic. Parliament consists of the National Assembly and the Senate; it passes legislation and scrutinises the Government."
      },
      {
        match: /président de la république|premier ministre|gouvernement/i,
        fr: "Attention à ne pas attribuer tous les pouvoirs au Président. La Constitution répartit les compétences entre le Président, le Gouvernement dirigé par le Premier ministre et le Parlement.",
        en: "Do not assume that all powers belong to the President. The Constitution divides responsibilities between the President, the Government led by the Prime Minister, and Parliament."
      },
      {
        match: /liberté d['’]expression|diffamation|haine|violence/i,
        fr: "« Liberté » ne signifie pas absence de limites. Une réponse affirmant que tout propos est autorisé est généralement fausse : la loi protège aussi les droits, la dignité et la sécurité d’autrui.",
        en: "Freedom does not mean the absence of limits. An answer claiming that every form of speech is permitted is generally wrong: the law also protects other people’s rights, dignity and safety."
      },
      {
        match: /impôt|impôts|services fiscaux|déclarer ses revenus/i,
        fr: "Ne confondez pas déclarer ses revenus et payer effectivement un impôt. Une déclaration peut être obligatoire même lorsque, après calcul, aucun impôt sur le revenu n’est dû.",
        en: "Do not confuse declaring income with actually paying tax. A tax return may be mandatory even when the calculation shows that no income tax is due."
      },
      {
        match: /union européenne|conseil de l['’]europe|parlement européen|commission européenne/i,
        fr: "Ne confondez pas l’Union européenne avec le Conseil de l’Europe, qui est une organisation distincte. Vérifiez aussi si la question porte sur la Commission, le Parlement européen ou une autre institution.",
        en: "Do not confuse the European Union with the Council of Europe, which is a separate organisation. Also check whether the question concerns the Commission, the European Parliament or another institution."
      },
      {
        match: /france métropolitaine|outre-mer|région|département|commune/i,
        fr: "Vérifiez toujours le périmètre demandé : France métropolitaine ou France entière, région ou département, collectivité territoriale ou service de l’État. Un chiffre juste dans un autre périmètre devient une mauvaise réponse.",
        en: "Always check the geographical or administrative scope: metropolitan France or the whole of France, region or department, local authority or State service. A number that is correct for a different scope becomes a wrong answer."
      },
      {
        match: /date|année|quand|depuis|siècle|guerre|révolution/i,
        fr: "Repérez précisément ce que la date désigne : début, fin, signature, adoption ou entrée en vigueur. Des événements proches peuvent avoir plusieurs dates importantes.",
        en: "Identify exactly what the date refers to: a beginning, an end, a signature, an adoption or an entry into force. Closely related events may have several important dates."
      },
      {
        match: /droit|devoir|obligatoire|interdit|autorisé|peut-on|possible/i,
        fr: "Distinguez une obligation légale, un droit et une simple recommandation. Les mots « doit », « peut » et « est interdit » ne sont pas interchangeables.",
        en: "Distinguish a legal obligation, a right and a simple recommendation. The words “must”, “may” and “is prohibited” are not interchangeable."
      },
      {
        match: /numéro d['’]urgence|samu|police|pompiers/i,
        fr: "Associez chaque numéro au bon service et à la bonne situation. Le 112 est le numéro d’urgence européen, mais les numéros français spécialisés restent à connaître.",
        en: "Match each number with the correct service and situation. 112 is the European emergency number, but the specialised French emergency numbers must also be known."
      }
    ];
    const specific = rules.find(rule => rule.match.test(text));
    if (specific) return specific;
    if (q.type === "situation") {
      return {
        fr: "Ne répondez pas selon une préférence personnelle. Identifiez d’abord le droit, le devoir ou le principe juridique réellement applicable à la situation.",
        en: "Do not answer according to personal preference. First identify the right, duty or legal principle that actually applies to the situation."
      };
    }
    const fallbacks = {
      t1: { fr: "Méfiez-vous des réponses absolues comme « toujours » ou « jamais » : les principes républicains s’appliquent souvent avec des garanties et des limites prévues par la loi.", en: "Be cautious with absolute answers such as “always” or “never”: republican principles often operate with safeguards and limits set by law." },
      t2: { fr: "Le piège le plus fréquent consiste à confondre les institutions. Repérez le verbe de la question — élire, nommer, voter, contrôler ou juger — pour identifier l’autorité compétente.", en: "The most common trap is confusing institutions. Focus on the verb in the question — elect, appoint, pass, scrutinise or judge — to identify the competent authority." },
      t3: { fr: "Un droit n’est pas nécessairement sans limite et un devoir ne s’applique pas toujours dans toutes les circonstances. Cherchez la règle précise plutôt qu’une affirmation trop générale.", en: "A right is not necessarily unlimited, and a duty does not always apply in every circumstance. Look for the precise rule rather than an overly broad statement." },
      t4: { fr: "Évitez d’associer un personnage, une œuvre ou un événement à la bonne période uniquement par intuition. Appuyez-vous sur un repère concret : date, régime politique, lieu ou réalisation.", en: "Avoid linking a person, work or event to a period based only on intuition. Use a concrete clue: a date, political system, place or achievement." },
      t5: { fr: "Distinguez la démarche obligatoire de la démarche simplement utile, ainsi que l’organisme public compétent. Une réponse plausible peut être fausse si elle désigne le mauvais interlocuteur.", en: "Distinguish a mandatory procedure from one that is merely useful, and identify the competent public body. A plausible answer may still be wrong if it names the wrong service." }
    };
    return fallbacks[q.theme] || fallbacks.t3;
  }

  function externalSource(q) {
    const singleAnswer = q.answers?.length === 1 ? q.answers[0] : q.choices?.[q.answer] || "";
    const haystack = `${q.q} ${singleAnswer}`;
    const note = contextNotes.find(item => item.match.test(haystack));
    if (note?.wiki) return { label: `Wikipédia — ${note.title}`, url: `https://fr.wikipedia.org/wiki/${note.wiki}` };
    return null;
  }

  function initialProgress() {
    return { known: [], review: [], seen: [], schedule: {}, practice: { answered: 0, correct: 0 }, exams: [] };
  }

  function loadProgress() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      delete saved.lastVisit;
      return { ...initialProgress(), ...saved };
    } catch (_) {
      return initialProgress();
    }
  }

  let progress = loadProgress();
  progress.schedule ||= {};
  saveProgress();

  function saveProgress() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }

  function uniquePush(list, value) {
    if (!list.includes(value)) list.push(value);
  }

  function removeFrom(list, value) {
    const i = list.indexOf(value);
    if (i >= 0) list.splice(i, 1);
  }

  function shuffle(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function sample(items, count) {
    return shuffle(items).slice(0, count);
  }

  function getQuestion(id) {
    return cardQuestions.find(q => q.id === id) || qcmQuestions.find(q => q.id === id);
  }

  function percent(a, b) {
    return b ? Math.round((a / b) * 100) : 0;
  }

  function isDue(id) {
    const item = progress.schedule[id];
    return Boolean(item?.dueAt && new Date(item.dueAt).getTime() <= Date.now());
  }

  function cardStatus(id) {
    if (progress.known.includes(id)) return "✓ Maîtrisée";
    const item = progress.schedule[id];
    if (!progress.seen.includes(id)) return "Nouvelle";
    if (!item) return progress.review.includes(id) ? "À revoir" : "En apprentissage";
    if (isDue(id)) return item.lastRating === "again" ? "À revoir maintenant" : "Révision prévue aujourd’hui";
    if (item.repetitions >= 2) return "À consolider";
    return "En apprentissage";
  }

  function intervalForRating(id, rating) {
    const previous = progress.schedule[id]?.intervalDays || 0;
    if (rating === "again") return 0;
    if (rating === "hard") return previous ? Math.max(1, Math.round(previous * 1.25)) : 1;
    if (rating === "good") return previous ? Math.max(3, Math.round(previous * 2)) : 3;
    return previous ? Math.max(7, Math.round(previous * 2.5)) : 7;
  }

  function intervalLabel(id, rating) {
    if (rating === "again") return "Dans 10 min";
    const days = intervalForRating(id, rating);
    if (days === 1) return "Demain";
    return `Dans ${days} jours`;
  }

  function themeOptions(includeAll = true) {
    return `${includeAll ? '<option value="all">Tous les thèmes</option>' : ""}${Object.entries(themes).map(([id, t]) => `<option value="${id}">${t.name}</option>`).join("")}`;
  }

  function tag(q) {
    const t = themes[q.theme];
    return `<span class="tag" style="--theme-color:${t.color}">${t.short}</span> ${q.official ? '<span class="tag tag-official">Question officielle</span>' : ""} ${q.type === "situation" ? '<span class="tag tag-situation">Mise en situation · entraînement</span>' : ""}`;
  }

  function flashAnswer(q, showEnglish) {
    const note = pedagogicalNote(q);
    const why = whyExplanation(q);
    const trap = commonTrap(q);
    const external = externalSource(q);
    const externalLink = external ? `<a href="${external.url}" target="_blank" rel="noopener">${external.label} <span aria-hidden="true">↗</span></a>` : "";
    const answer = q.answers?.[0] || q.choices[q.answer];
    const acceptedAnswers = q.answers?.length > 1 ? `<details class="accepted-answers"><summary>Voir les autres formulations admises</summary><ul>${q.answers.slice(1).map(a => `<li>${a}</li>`).join("")}</ul></details>` : "";
    const context = note && note.fr !== why.fr
      ? `<p class="context-note" lang="${showEnglish ? "en" : "fr"}"><strong>${showEnglish ? "Useful context" : "Repère utile"}</strong>${showEnglish ? note.en : note.fr}</p>`
      : "";
    const sourceLabel = q.answers ? "Source de la question et attribution" : "Source officielle";
    const attribution = q.answers ? `<p class="source-note">Réponse pédagogique indépendante proposée par leqcmcivique.fr ; l’administration ne publie pas de corrigé officiel.${external ? " La ressource Wikipédia apporte uniquement un contexte complémentaire." : ""}</p>` : "";
    return `<div class="short-answer"><span>Réponse à retenir</span><strong>${answer}</strong></div>${acceptedAnswers}<section class="explanation-box"><div class="explanation-heading"><h3>${showEnglish ? "To understand" : "Pour comprendre"}</h3><button class="translation-button" id="toggle-translation" type="button" lang="${showEnglish ? "en" : "fr"}">${showEnglish ? "Lire en français" : "Read in English"}</button></div><p class="explanation-main" lang="${showEnglish ? "en" : "fr"}">${showEnglish ? why.en : why.fr}</p>${context}<aside class="trap-box" lang="${showEnglish ? "en" : "fr"}"><strong>${showEnglish ? "Common trap" : "Piège fréquent"}</strong><p>${showEnglish ? trap.en : trap.fr}</p></aside></section>${glossaryKnowledge(q)}<div class="answer-sources"><a href="${sourceUrls[q.source]}" target="_blank" rel="noopener">${sourceLabel} <span aria-hidden="true">↗</span></a>${externalLink}</div>${attribution}`;
  }

  function practiceFeedback(q, selected, isReworded) {
    const correct = selected === q.answer;
    const why = whyExplanation(q).fr;
    const trap = commonTrap(q).fr;
    const external = externalSource(q);
    const externalLink = external ? `<a href="${external.url}" target="_blank" rel="noopener">${external.label} <span aria-hidden="true">↗</span></a>` : "";
    const context = why !== q.explanation ? `<div class="feedback-context"><strong>Pour mieux comprendre</strong><p>${why}</p></div>` : "";
    return `<section class="feedback ${correct ? "" : "incorrect"}" aria-label="Correction">
      <h3>${correct ? "Bonne réponse" : "Réponse incorrecte"}</h3>
      <div class="feedback-answer"><span>Réponse à retenir</span><strong>${q.choices[q.answer]}</strong></div>
      ${isReworded ? `<p class="official-wording"><strong>Formulation d’origine :</strong> ${q.q}</p>` : ""}
      <div class="feedback-explanation"><strong>Pourquoi&nbsp;?</strong><p>${q.explanation}</p></div>
      ${context}
      <aside class="trap-box"><strong>Piège fréquent</strong><p>${trap}</p></aside>
      ${glossaryKnowledge(q)}
      <div class="answer-sources"><a href="${sourceUrls[q.source]}" target="_blank" rel="noopener">Voir la source officielle <span aria-hidden="true">↗</span></a>${externalLink}</div>
    </section>`;
  }

  function speechButton() {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) return "";
    return `<div class="question-audio"><button class="listen-button" id="listen-question" type="button" aria-label="Lire la question à voix haute" aria-pressed="false"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4Zm11.5-.5a5 5 0 0 1 0 7l1.4 1.4a7 7 0 0 0 0-9.8l-1.4 1.4Zm2.8-2.8a9 9 0 0 1 0 12.6l1.4 1.4a11 11 0 0 0 0-15.4l-1.4 1.4Z"/></svg><span>Écouter</span></button></div>`;
  }

  function stopSpeech() {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    activeUtterance = null;
  }

  function bindSpeechButton(text) {
    const button = document.querySelector("#listen-question");
    if (!button) return;
    button.addEventListener("click", () => {
      if (activeUtterance) {
        stopSpeech();
        button.classList.remove("is-speaking");
        button.setAttribute("aria-pressed", "false");
        button.setAttribute("aria-label", "Lire la question à voix haute");
        button.querySelector("span").textContent = "Écouter";
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = window.speechSynthesis.getVoices().find(item => item.lang?.toLowerCase().startsWith("fr"));
      utterance.lang = "fr-FR";
      utterance.rate = .95;
      if (voice) utterance.voice = voice;
      const reset = () => {
        if (activeUtterance !== utterance) return;
        activeUtterance = null;
        if (!button.isConnected) return;
        button.classList.remove("is-speaking");
        button.setAttribute("aria-pressed", "false");
        button.setAttribute("aria-label", "Lire la question à voix haute");
        button.querySelector("span").textContent = "Écouter";
      };
      utterance.addEventListener("end", reset);
      utterance.addEventListener("error", reset);
      activeUtterance = utterance;
      button.classList.add("is-speaking");
      button.setAttribute("aria-pressed", "true");
      button.setAttribute("aria-label", "Arrêter la lecture de la question");
      button.querySelector("span").textContent = "Arrêter";
      window.speechSynthesis.speak(utterance);
    });
  }

  function alternateWording(question) {
    const rules = [
      [/^En quelle année (.+?)\s*\?$/i, "À quelle date $1 ?"],
      [/^Depuis quand (.+?)\s*\?$/i, "À partir de quelle date $1 ?"],
      [/^Quand (.+?)\s*\?$/i, "À quelle date ou période $1 ?"],
      [/^Où (.+?)\s*\?$/i, "Dans quel lieu $1 ?"],
      [/^À quoi sert le (.+?)\s*\?$/i, "Quelle est la fonction du $1 ?"],
      [/^À quoi sert la (.+?)\s*\?$/i, "Quelle est la fonction de la $1 ?"],
      [/^À quoi sert l[’'](.+?)\s*\?$/i, "Quelle est la fonction de l’$1 ?"],
      [/^À quoi sert un (.+?)\s*\?$/i, "Quelle est la fonction d’un $1 ?"],
      [/^À quoi sert une (.+?)\s*\?$/i, "Quelle est la fonction d’une $1 ?"],
      [/^Qu’est-ce que (.+?)\s*\?$/i, "Quelle définition donner à : « $1 » ?"],
      [/^Qu'est-ce que (.+?)\s*\?$/i, "Quelle définition donner à : « $1 » ?"],
      [/^Que signifie (.+?)\s*\?$/i, "Que veut dire $1 ?"],
      [/^Quel est le rôle (.+?)\s*\?$/i, "Quelle est la mission $1 ?"],
      [/^Quelle est la durée du mandat (.+?)\s*\?$/i, "Combien d’années dure le mandat $1 ?"],
      [/^Quelle est la durée de (.+?)\s*\?$/i, "Combien de temps dure $1 ?"],
      [/^Qui a peint (.+?)\s*\?$/i, "Quel artiste est l’auteur de $1 ?"],
      [/^Qui a composé (.+?)\s*\?$/i, "Quel compositeur est l’auteur de $1 ?"],
      [/^Qui peut (.+?)\s*\?$/i, "Qui est autorisé à $1 ?"],
      [/^Comment est désigné (.+?)\s*\?$/i, "De quelle manière $1 est-il désigné ?"],
      [/^Comment sont désignés (.+?)\s*\?$/i, "De quelle manière $1 sont-ils désignés ?"],
      [/^Quel numéro d’urgence permet d’appeler (.+?)\s*\?$/i, "Quel numéro faut-il composer pour joindre $1 en urgence ?"],
      [/^Quel numéro d'urgence permet d'appeler (.+?)\s*\?$/i, "Quel numéro faut-il composer pour joindre $1 en urgence ?"],
      [/^Quelle institution française (.+?)\s*\?$/i, "Quelle est l’institution française qui $1 ?"],
      [/^Quelle institution (.+?)\s*\?$/i, "Quelle est l’institution qui $1 ?"],
      [/^Quelle organisation (.+?)\s*\?$/i, "Quelle est l’organisation qui $1 ?"],
      [/^Combien y a-t-il de (.+?)\s*\?$/i, "Quel est le nombre de $1 ?"],
      [/^Est-ce obligatoire de (.+?)\s*\?$/i, "L’action suivante est-elle obligatoire : $1 ?"],
      [/^Est-ce légal de (.+?)\s*\?$/i, "La loi autorise-t-elle à $1 ?"],
      [/^Peut-on (.+?)\s*\?$/i, "Est-il permis de $1 ?"],
      [/^Est-il possible de (.+?)\s*\?$/i, "La loi permet-elle de $1 ?"]
    ];
    for (const [pattern, replacement] of rules) {
      if (pattern.test(question)) return question.replace(pattern, replacement);
    }
    return question;
  }

  function toast(message) {
    const el = document.querySelector("#toast");
    el.textContent = message;
    el.classList.add("show");
    window.setTimeout(() => el.classList.remove("show"), 2300);
  }

  function parseRoute() {
    const raw = location.hash.slice(2) || "";
    const [path, query = ""] = raw.split("?");
    return { path: path || "home", params: new URLSearchParams(query) };
  }

  function setActiveNav(path) {
    const activeSection = path === "resultats" ? "examen" : path;
    document.querySelectorAll("[data-nav]").forEach(link => {
      const active = activeSection === link.dataset.nav;
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function layout(content, narrow = false, scrollToTop = true) {
    const scrollTop = window.scrollY;
    app.innerHTML = `<div class="page ${narrow ? "page-narrow" : ""}">${content}</div>`;
    window.scrollTo({ top: scrollToTop ? 0 : scrollTop, behavior: "instant" });
  }

  function focusRendered(selector) {
    if (!selector) return;
    window.requestAnimationFrame(() => {
      const target = document.querySelector(selector);
      if (!target) return;
      if (!target.matches("a, button, input, select, textarea, [tabindex]")) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    });
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;"
    })[character]);
  }

  function normalizeSearch(value) {
    return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr");
  }

  function loadGlossaryData() {
    if (!glossaryDataPromise) {
      glossaryDataPromise = fetch("./data/glossaire-notions-civiques.json")
        .then(response => {
          if (!response.ok) throw new Error(`glossary-${response.status}`);
          return response.json();
        })
        .then(data => {
          if (!Array.isArray(data.entrees) || !data.metadata) throw new Error("glossary-invalid");
          glossaryData = data;
          return data;
        })
        .catch(error => {
          glossaryDataPromise = null;
          throw error;
        });
    }
    return glossaryDataPromise;
  }

  const glossaryThemeIds = {
    t1: "principes_valeurs",
    t2: "institutions",
    t3: "droits_devoirs",
    t4: "histoire_geo_culture",
    t5: "vie_en_societe"
  };

  const glossaryAliases = {
    devise: ["liberte egalite fraternite"],
    ddhc: ["declaration de 1789", "droits de l homme et du citoyen"],
    "fete-nationale": ["14 juillet"],
    "langue-francaise": ["langue francaise", "francais est la langue"],
    "constitution-1958": ["constitution de 1958"],
    "recensement-jdc": ["journee defense et citoyennete", "jdc"],
    "guerres-mondiales": ["11 novembre 1918", "8 mai 1945"],
    "cinquieme-republique": ["cinquieme republique", "5e republique"],
    ivg: ["ivg"],
    pacs: ["pacs"],
    "assurance-maladie": ["carte vitale"],
    "numeros-urgence": ["numero d urgence", "numeros d urgence"]
  };

  function normalizeKnowledgeText(value) {
    return normalizeSearch(value)
      .replace(/œ/g, "oe")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function containsKnowledgePhrase(text, phrase) {
    return ` ${text} `.includes(` ${phrase} `);
  }

  function glossaryEntryAliases(entry) {
    const aliases = [normalizeKnowledgeText(entry.terme)];
    const beforeParenthesis = normalizeKnowledgeText(entry.terme.split("(")[0]);
    if (beforeParenthesis.length >= 4) aliases.push(beforeParenthesis);
    for (const match of entry.terme.matchAll(/\(([^)]+)\)/g)) {
      const parenthetical = normalizeKnowledgeText(match[1]);
      if (parenthetical.length >= 3) aliases.push(parenthetical);
    }
    aliases.push(...(glossaryAliases[entry.slug] || []));
    return [...new Set(aliases.filter(alias => alias.length >= 3))];
  }

  function glossaryEntriesForQuestion(q, limit = 3) {
    if (!glossaryData?.entrees) return [];
    const question = normalizeKnowledgeText(q.q);
    const correctAnswer = normalizeKnowledgeText(q.answers?.join(" ") || q.choices?.[q.answer] || "");
    const broadTerms = new Set(["loi", "maire", "euro", "region", "commune", "parlement", "gouvernement", "republique"]);

    return glossaryData.entrees
      .map(entry => {
        let score = 0;
        const isBroadTerm = broadTerms.has(entry.slug);
        if (isBroadTerm && glossaryThemeIds[q.theme] !== entry.thematique) return { entry, score };
        if (entry.slug === "parlement" && containsKnowledgePhrase(question, "parlement europeen")) return { entry, score };
        for (const alias of glossaryEntryAliases(entry)) {
          if (containsKnowledgePhrase(question, alias)) score = Math.max(score, 6);
          else if (!isBroadTerm && containsKnowledgePhrase(correctAnswer, alias)) score = Math.max(score, 4);
        }
        if (score && glossaryThemeIds[q.theme] === entry.thematique) score += 1;
        return { entry, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score || a.entry.terme.localeCompare(b.entry.terme, "fr"))
      .slice(0, limit)
      .map(item => item.entry);
  }

  function glossaryKnowledge(q) {
    const entries = glossaryEntriesForQuestion(q);
    if (!entries.length) return "";
    const items = entries.map(entry => `<article class="knowledge-entry">
      <h4><a href="#/glossaire?notion=${encodeURIComponent(entry.slug)}">${escapeHtml(entry.terme)}</a></h4>
      <p>${escapeHtml(entry.definition)}</p>
      ${entry.reference ? `<p class="knowledge-reference"><strong>Référence :</strong> ${escapeHtml(entry.reference)}</p>` : ""}
    </article>`).join("");
    return `<details class="knowledge-panel">
      <summary>Approfondir avec le glossaire · ${entries.length} notion${entries.length > 1 ? "s" : ""}</summary>
      <div class="knowledge-content">${items}<p class="source-note">Définitions complémentaires produites par examenciviquenaturalisation.fr et publiées sous Licence Ouverte 2.0.</p></div>
    </details>`;
  }

  function renderHome() {
    const known = progress.known.length;
    const seen = progress.seen.length;
    const reviewCount = reviewableQuestions.filter(q => progress.review.includes(q.id) || isDue(q.id)).length;
    const best = progress.exams.length ? Math.max(...progress.exams.map(e => e.score)) : null;
    const last = progress.exams.at(-1);
    const themeCards = Object.entries(themes).map(([id, theme], index) => {
      const pool = cardQuestions.filter(q => q.theme === id);
      const officialCount = pool.filter(q => q.official).length;
      const situationCount = pool.filter(q => q.type === "situation").length;
      const mastered = pool.filter(q => progress.known.includes(q.id)).length;
      return `<a class="card card-link" style="--theme-color:${theme.color}" href="#/reviser?theme=${id}">
        <span class="card-icon">${index + 1}</span>
        <h3>${theme.name}</h3>
        <p>${officialCount} questions officielles${situationCount ? ` + ${situationCount} situations d’entraînement` : ""}</p>
        <p>${mastered} carte${mastered > 1 ? "s" : ""} maîtrisée${mastered > 1 ? "s" : ""} sur ${pool.length}</p>
        <div class="progress" aria-label="${percent(mastered, pool.length)} % maîtrisé"><span style="--progress:${percent(mastered, pool.length) / 100}"></span></div>
      </a>`;
    }).join("");

    layout(`
      <section class="hero">
        <div>
          <p class="eyebrow">Examen civique · Naturalisation</p>
          <h1>Les bons repères pour réussir.</h1>
          <p class="lead">Révisez à votre rythme avec des cartes simples, puis testez-vous dans les conditions de l’examen.</p>
          <div class="actions">
            <a class="button" href="#/reviser">Commencer à réviser <span aria-hidden="true">→</span></a>
            <a class="button button-secondary" href="#/examen">Passer un examen blanc</a>
          </div>
        </div>
        <aside class="hero-card" aria-label="Format officiel de l’examen">
          <span class="exam-number">40</span>
          <p>questions à choix multiples</p>
          <hr>
          <div class="exam-facts">
            <div><strong>45 min</strong><span>maximum</span></div>
            <div><strong>32/40</strong><span>pour réussir</span></div>
            <div><strong>5</strong><span>thématiques</span></div>
          </div>
        </aside>
      </section>

      <section class="section" aria-labelledby="progress-title">
        <div class="section-heading"><div><p class="eyebrow">Votre progression</p><h2 id="progress-title">Reprenez là où vous en étiez</h2></div></div>
        <div class="stat-grid">
          <div class="stat"><strong>${known}</strong><span>cartes maîtrisées</span></div>
          ${reviewCount ? `<a class="stat stat-link" href="#/reviser?filter=review" aria-label="Réviser les ${reviewCount} carte${reviewCount > 1 ? "s" : ""} à revoir"><strong>${reviewCount}</strong><span>carte${reviewCount > 1 ? "s" : ""} à revoir</span><small>Réviser maintenant <span aria-hidden="true">→</span></small></a>` : '<div class="stat stat-empty"><strong>0</strong><span>carte à revoir</span><small>Aucune carte en attente</small></div>'}
          <div class="stat"><strong>${seen}</strong><span>notions consultées</span></div>
          <div class="stat"><strong>${best === null ? "—" : `${best}/40`}</strong><span>meilleur examen</span></div>
        </div>
        ${last ? `<p>Dernier examen blanc : <strong>${last.score}/40</strong> le ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(last.date))}.</p>` : ""}
      </section>

      <section class="section" aria-labelledby="themes-title">
        <div class="section-heading"><div><p class="eyebrow">Programme officiel</p><h2 id="themes-title">Réviser par thème</h2></div><a href="#/reviser">Voir toutes les cartes</a></div>
        <div class="grid">${themeCards}</div>
      </section>

      <section class="section">
        <div class="notice"><strong>Couverture intégrale</strong>Les 258 questions de connaissance publiées pour la naturalisation sont intégrées aux flashcards. Les réponses sont pédagogiques : l’administration publie les questions, mais pas de corrigé officiel. <a href="#/glossaire">Consulter également le glossaire des 81 notions civiques</a>.</div>
        <div class="notice notice-warning"><strong>Bon à savoir</strong>Les questions officielles de mise en situation ne sont pas publiques. Celles proposées ici sont des exercices originaux signalés comme tels.</div>
      </section>
    `);
  }

  function renderRevise(params) {
    const preset = params.get("theme") || "all";
    const presetFilter = params.get("filter") || "all";
    layout(`
      <p class="eyebrow">Mémoriser</p>
      <h1>Réviser avec les flashcards</h1>
      <p class="lead">Parcourez les 258 questions de connaissance de la liste officielle et les mises en situation d’entraînement. Après chaque réponse, indiquez votre niveau : la prochaine révision sera automatiquement programmée sur cet appareil.</p>
      <div class="toolbar">
        <div class="field"><label for="flash-theme">Thème</label><select id="flash-theme">${themeOptions()}</select></div>
        <div class="field"><label for="flash-filter">Cartes à afficher</label><select id="flash-filter"><option value="all">Toutes les cartes</option><option value="review">À revoir</option><option value="due">Prévues aujourd’hui</option><option value="unseen">Pas encore vues</option><option value="known">Maîtrisées</option></select></div>
        <div class="field"><label for="flash-origin">Origine</label><select id="flash-origin"><option value="all">Officielles + entraînement</option><option value="official">Questions officielles uniquement</option><option value="training">Situations d’entraînement uniquement</option></select></div>
        <div class="field"><label for="flash-wording">Formulation</label><select id="flash-wording"><option value="mixed">Mixte : d’origine et reformulée</option><option value="original">Toujours la formulation d’origine</option><option value="alternate">Reformulée si disponible</option></select></div>
        <button class="button" id="start-flash" type="button">Lancer la révision</button>
      </div>
      <div id="flash-zone"></div>
    `);
    document.querySelector("#flash-theme").value = themes[preset] ? preset : "all";
    document.querySelector("#flash-filter").value = ["all", "review", "due", "unseen", "known"].includes(presetFilter) ? presetFilter : "all";
    document.querySelector("#start-flash").addEventListener("click", () => startFlashcards(true));
    startFlashcards();
  }

  function startFlashcards(scrollToCards = false) {
    const theme = document.querySelector("#flash-theme").value;
    const filter = document.querySelector("#flash-filter").value;
    const origin = document.querySelector("#flash-origin").value;
    const wording = document.querySelector("#flash-wording").value;
    let pool = (["review", "due"].includes(filter) ? reviewableQuestions : cardQuestions).filter(q => theme === "all" || q.theme === theme);
    if (origin === "official") pool = pool.filter(q => q.official);
    if (origin === "training") pool = pool.filter(q => q.type === "situation");
    if (filter === "review") pool = pool.filter(q => progress.review.includes(q.id) || isDue(q.id));
    if (filter === "due") pool = pool.filter(q => isDue(q.id));
    if (filter === "unseen") pool = pool.filter(q => !progress.seen.includes(q.id));
    if (filter === "known") pool = pool.filter(q => progress.known.includes(q.id));
    const ids = shuffle(pool).map(q => q.id);
    const wordings = Object.fromEntries(ids.map(id => {
      const q = getQuestion(id);
      const alternate = alternateWording(q.q);
      const useAlternate = wording === "alternate" || (wording === "mixed" && Math.random() < .5);
      return [id, useAlternate ? alternate : q.q];
    }));
    flashSession = { ids, wordings, translations: {}, index: 0, revealed: false };
    renderFlashcard(scrollToCards ? "#flash-question" : null);
    if (scrollToCards && window.matchMedia("(max-width: 800px)").matches) {
      const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
      window.requestAnimationFrame(() => document.querySelector("#flash-zone")?.scrollIntoView({ behavior, block: "start" }));
    }
  }

  function renderFlashcard(focusTarget = null) {
    stopSpeech();
    const zone = document.querySelector("#flash-zone");
    if (!flashSession.ids.length) {
      zone.innerHTML = `<div class="empty"><h2>Aucune carte ici</h2><p>Essayez un autre filtre ou un autre thème.</p></div>`;
      focusRendered(focusTarget || ".empty h2");
      return;
    }
    if (flashSession.index >= flashSession.ids.length) {
      zone.innerHTML = `<div class="result-hero" style="--result-color:var(--green)"><p class="eyebrow">Session terminée</p><h2>Révision enregistrée</h2><p>Les prochaines cartes seront proposées selon vos réponses et leur date de révision.</p><button class="button" id="restart-flash" type="button">Nouvelle session</button></div>`;
      document.querySelector("#restart-flash").addEventListener("click", () => startFlashcards(true));
      focusRendered(focusTarget || ".result-hero h2");
      return;
    }
    const q = getQuestion(flashSession.ids[flashSession.index]);
    const displayedQuestion = flashSession.wordings[q.id] || q.q;
    const isReworded = displayedQuestion !== q.q;
    zone.innerHTML = `<div class="study-shell">
      <div class="study-meta"><span>Carte ${flashSession.index + 1} sur ${flashSession.ids.length}</span><span>${cardStatus(q.id)}</span></div>
      <div class="progress"><span style="--progress:${percent(flashSession.index + 1, flashSession.ids.length) / 100}"></span></div>
      <article class="flashcard" aria-labelledby="flash-question">
        <div class="flash-tags">${tag(q)} ${isReworded ? '<span class="tag tag-reworded">Formulation d’entraînement</span>' : ""}</div>
        ${speechButton()}
        <h2 id="flash-question">${displayedQuestion}</h2>
        ${flashSession.revealed ? `<div class="answer" aria-label="Réponse affichée">${isReworded ? `<p class="official-wording"><strong>Formulation officielle :</strong> ${q.q}</p>` : ""}${flashAnswer(q, !!flashSession.translations[q.id])}</div>` : '<button class="button button-secondary reveal-button" id="flip-card" type="button" aria-expanded="false">Afficher la réponse</button>'}
      </article>
      ${flashSession.revealed ? `<fieldset class="rating-panel"><legend>Comment évaluez-vous votre réponse&nbsp;?</legend><div class="rating-grid">
        <button class="rating-button rating-again" data-rating="again" type="button"><strong>Je ne savais pas</strong><small>${intervalLabel(q.id, "again")}</small></button>
        <button class="rating-button rating-hard" data-rating="hard" type="button"><strong>Presque</strong><small>${intervalLabel(q.id, "hard")}</small></button>
        <button class="rating-button rating-good" data-rating="good" type="button"><strong>Je savais</strong><small>${intervalLabel(q.id, "good")}</small></button>
        <button class="rating-button rating-easy" data-rating="easy" type="button"><strong>Trop facile</strong><small>${intervalLabel(q.id, "easy")}</small></button>
      </div></fieldset>` : ""}
      <div class="study-controls">
        <button class="button button-ghost" id="prev-card" type="button" ${flashSession.index === 0 ? "disabled" : ""}>← Précédente</button>
        <button class="button button-ghost" id="next-card" type="button" ${flashSession.index === flashSession.ids.length - 1 ? "disabled" : ""}>Suivante →</button>
      </div>
    </div>`;
    bindSpeechButton(displayedQuestion);
    document.querySelector("#flip-card")?.addEventListener("click", () => { flashSession.revealed = true; uniquePush(progress.seen, q.id); saveProgress(); renderFlashcard(".answer"); });
    document.querySelector("#toggle-translation")?.addEventListener("click", () => { flashSession.translations[q.id] = !flashSession.translations[q.id]; renderFlashcard("#toggle-translation"); });
    document.querySelector("#prev-card").addEventListener("click", () => { flashSession.index--; flashSession.revealed = false; renderFlashcard("#flash-question"); });
    document.querySelector("#next-card").addEventListener("click", () => { flashSession.index++; flashSession.revealed = false; renderFlashcard("#flash-question"); });
    document.querySelectorAll("[data-rating]").forEach(button => button.addEventListener("click", () => rateCard(q.id, button.dataset.rating)));
    focusRendered(focusTarget);
  }

  function rateCard(id, rating) {
    uniquePush(progress.seen, id);
    const wasKnown = progress.known.includes(id);
    const previous = progress.schedule[id] || { repetitions: 0, intervalDays: 0, lapses: 0 };
    const intervalDays = intervalForRating(id, rating);
    const repetitions = rating === "again" ? 0 : previous.repetitions + 1;
    const delay = rating === "again" ? 10 * 60 * 1000 : intervalDays * 24 * 60 * 60 * 1000;
    progress.schedule[id] = {
      repetitions,
      intervalDays,
      lapses: previous.lapses + (rating === "again" ? 1 : 0),
      lastRating: rating,
      lastReviewedAt: new Date().toISOString(),
      dueAt: new Date(Date.now() + delay).toISOString()
    };
    if (["again", "hard"].includes(rating)) uniquePush(progress.review, id);
    else removeFrom(progress.review, id);
    if ((wasKnown && ["good", "easy"].includes(rating)) || (repetitions >= 3 && intervalDays >= 14)) uniquePush(progress.known, id);
    else removeFrom(progress.known, id);
    if (rating === "again" && !flashSession.ids.slice(flashSession.index + 1).includes(id)) {
      flashSession.ids.splice(Math.min(flashSession.index + 4, flashSession.ids.length), 0, id);
    }
    saveProgress();
    const messages = {
      again: "Cette carte reviendra dans quelques minutes",
      hard: "Révision programmée pour demain",
      good: `Révision programmée dans ${intervalDays} jours`,
      easy: `Révision espacée de ${intervalDays} jours`
    };
    toast(messages[rating]);
    flashSession.index++;
    flashSession.revealed = false;
    renderFlashcard("#flash-question");
  }

  function renderPractice() {
    layout(`
      <p class="eyebrow">S’entraîner</p>
      <h1>Entraînement QCM</h1>
      <p class="lead">Choisissez une série courte. La correction et l’explication apparaissent après chaque réponse.</p>
      <div class="toolbar">
        <div class="field"><label for="practice-theme">Thème</label><select id="practice-theme">${themeOptions()}</select></div>
        <div class="field"><label for="practice-count">Nombre de questions</label><select id="practice-count"><option>5</option><option selected>10</option><option>20</option></select></div>
        <button class="button" id="start-practice" type="button">Commencer</button>
      </div>
      <div id="practice-zone"></div>
    `);
    document.querySelector("#start-practice").addEventListener("click", startPractice);
  }

  function startPractice() {
    const theme = document.querySelector("#practice-theme").value;
    const count = Number(document.querySelector("#practice-count").value);
    const pool = qcmQuestions.filter(q => theme === "all" || q.theme === theme);
    const ids = sample(pool, Math.min(count, pool.length)).map(q => q.id);
    const wordings = Object.fromEntries(ids.map(id => {
      const q = getQuestion(id);
      const alternate = alternateWording(q.q);
      return [id, alternate !== q.q && Math.random() < .5 ? alternate : q.q];
    }));
    practiceSession = { ids, wordings, index: 0, answers: [], score: 0, revealed: false };
    renderPracticeQuestion(false, ".question-card h2");
  }

  function renderPracticeQuestion(preserveScroll = false, focusTarget = null) {
    stopSpeech();
    const scrollTop = window.scrollY;
    const zone = document.querySelector("#practice-zone");
    if (practiceSession.index >= practiceSession.ids.length) {
      zone.innerHTML = `<div class="result-hero" style="--result-color:${practiceSession.score >= practiceSession.ids.length * .8 ? "var(--green)" : "var(--orange)"}">
        <p class="eyebrow">Série terminée</p><h2>${practiceSession.score}/${practiceSession.ids.length} bonnes réponses</h2>
        <p>${practiceSession.score >= practiceSession.ids.length * .8 ? "Très bon résultat. Continuez à consolider vos acquis." : "Repérez les notions à revoir, puis tentez une nouvelle série."}</p>
        <button class="button" id="restart-practice" type="button">Nouvelle série</button>
      </div>`;
      document.querySelector("#restart-practice").addEventListener("click", startPractice);
      focusRendered(focusTarget || ".result-hero h2");
      return;
    }
    const q = getQuestion(practiceSession.ids[practiceSession.index]);
    const displayedQuestion = practiceSession.wordings[q.id] || q.q;
    const isReworded = displayedQuestion !== q.q;
    const selected = practiceSession.answers[practiceSession.index];
    zone.innerHTML = `<div class="question-shell">
      <div class="question-topbar"><span>Question ${practiceSession.index + 1}/${practiceSession.ids.length}</span><strong>${practiceSession.score} bonne${practiceSession.score > 1 ? "s" : ""} réponse${practiceSession.score > 1 ? "s" : ""}</strong></div>
      <div class="progress"><span style="--progress:${percent(practiceSession.index, practiceSession.ids.length) / 100}"></span></div>
      <article class="question-card">
        <div>${tag(q)} ${isReworded ? '<span class="tag tag-reworded">Formulation d’entraînement</span>' : ""}</div>${speechButton()}<h2>${displayedQuestion}</h2>
        <div class="choices">${q.choices.map((choice, i) => `<button class="choice ${practiceSession.revealed ? (i === q.answer ? "correct" : i === selected ? "incorrect" : "") : ""}" data-choice="${i}" type="button" ${practiceSession.revealed ? "disabled" : ""}><span class="choice-letter">${LETTERS[i]}</span><span>${choice}</span></button>`).join("")}</div>
        ${practiceSession.revealed ? practiceFeedback(q, selected, isReworded) : ""}
        <div class="question-nav"><span></span>${practiceSession.revealed ? '<button class="button" id="practice-next" type="button">Question suivante →</button>' : ""}</div>
      </article>
    </div>`;
    bindSpeechButton(displayedQuestion);
    document.querySelectorAll("[data-choice]").forEach(btn => btn.addEventListener("click", () => answerPractice(Number(btn.dataset.choice))));
    document.querySelector("#practice-next")?.addEventListener("click", () => { practiceSession.index++; practiceSession.revealed = false; renderPracticeQuestion(false, ".question-card h2"); });
    if (preserveScroll) window.scrollTo({ top: scrollTop, behavior: "instant" });
    focusRendered(focusTarget);
  }

  function answerPractice(choice) {
    const q = getQuestion(practiceSession.ids[practiceSession.index]);
    practiceSession.answers[practiceSession.index] = choice;
    practiceSession.revealed = true;
    practiceSession.score += choice === q.answer ? 1 : 0;
    progress.practice.answered++;
    progress.practice.correct += choice === q.answer ? 1 : 0;
    uniquePush(progress.seen, q.id);
    if (choice !== q.answer) uniquePush(progress.review, q.id);
    saveProgress();
    renderPracticeQuestion(true, ".feedback");
  }

  function createExam(mode = "mixed") {
    const pool = (theme, type) => qcmQuestions.filter(q => q.theme === theme && q.type === type);
    const picked = mode === "official"
      ? [
          ...sample(pool("t1", "knowledge"), 11), ...sample(pool("t2", "knowledge"), 6),
          ...sample(pool("t3", "knowledge"), 11), ...sample(pool("t4", "knowledge"), 8),
          ...sample(pool("t5", "knowledge"), 4)
        ]
      : [
          ...sample(pool("t1", "knowledge"), 5), ...sample(pool("t1", "situation"), 6),
          ...sample(pool("t2", "knowledge"), 6),
          ...sample(pool("t3", "knowledge"), 5), ...sample(pool("t3", "situation"), 6),
          ...sample(pool("t4", "knowledge"), 8), ...sample(pool("t5", "knowledge"), 4)
        ];
    const ids = shuffle(picked).map(q => q.id);
    const wordings = Object.fromEntries(ids.map(id => {
      const q = getQuestion(id);
      const alternate = alternateWording(q.q);
      return [id, mode === "mixed" && alternate !== q.q && Math.random() < .35 ? alternate : q.q];
    }));
    return { mode, ids, wordings, answers: {}, flagged: [], index: 0, startedAt: Date.now(), duration: 45 * 60 * 1000 };
  }

  function examModeNote(mode) {
    if (mode === "official") {
      return "<strong>Connaissances officielles uniquement</strong>Ce tirage exclut les situations d’entraînement. Les notions viennent de la liste publique du ministère ; leur présentation et les choix de réponses sont adaptés au format QCM, car le questionnaire complet de l’examen n’est pas publié.";
    }
    return "<strong>Simulation pédagogique mixte</strong>Le tirage associe des questions de connaissance issues de la liste publique et des mises en situation originales, signalées comme telles.";
  }

  function loadExam() {
    try { return JSON.parse(localStorage.getItem(EXAM_KEY) || "null"); } catch (_) { return null; }
  }

  function saveExam(exam) {
    localStorage.setItem(EXAM_KEY, JSON.stringify(exam));
  }

  function renderExamLanding() {
    const active = loadExam();
    layout(`
      <p class="eyebrow">Conditions réelles</p>
      <h1>Examen blanc</h1>
      <p class="lead">Un tirage de 40 questions, 45 minutes et une seule bonne réponse par question.</p>
      ${active ? '<div class="notice"><strong>Une session est en cours</strong>Vous pouvez reprendre exactement là où vous vous êtes arrêté.</div>' : ""}
      <div class="grid">
        <div class="card"><span class="card-icon">40</span><h2 class="card-title">40 questions</h2><p>Selon la répartition officielle entre les cinq thèmes.</p></div>
        <div class="card"><span class="card-icon">45</span><h2 class="card-title">45 minutes</h2><p>Le chronomètre continue si vous rechargez la page.</p></div>
        <div class="card"><span class="card-icon">80</span><h2 class="card-title">80 % requis</h2><p>Il faut obtenir au moins 32 réponses correctes.</p></div>
      </div>
      <div class="toolbar">
        <div class="field field-grow"><label for="exam-mode">Contenu de l’examen</label><select id="exam-mode"><option value="mixed">Mixte : connaissances + situations</option><option value="official">Connaissances officielles uniquement</option></select></div>
      </div>
      <div class="notice notice-warning" id="exam-mode-note" aria-live="polite">${examModeNote(active?.mode || "mixed")}</div>
      <div class="actions">
        ${active ? '<button class="button" id="resume-exam" type="button">Reprendre l’examen</button><button class="button button-secondary" id="new-exam" type="button">Recommencer</button>' : '<button class="button" id="new-exam" type="button">Démarrer l’examen</button>'}
      </div>
    `, true);
    const modeSelect = document.querySelector("#exam-mode");
    modeSelect.value = active?.mode || "mixed";
    modeSelect.addEventListener("change", () => { document.querySelector("#exam-mode-note").innerHTML = examModeNote(modeSelect.value); });
    document.querySelector("#resume-exam")?.addEventListener("click", () => renderExamSession(false, ".question-card h2"));
    document.querySelector("#new-exam")?.addEventListener("click", () => {
      if (active && !confirm("Recommencer supprimera la session actuelle. Continuer ?")) return;
      saveExam(createExam(modeSelect.value));
      renderExamSession(false, ".question-card h2");
    });
  }

  function renderExamSession(preserveScroll = false, focusTarget = null) {
    stopSpeech();
    let exam = loadExam();
    if (!exam) { renderExamLanding(); return; }
    if (Date.now() - exam.startedAt >= exam.duration) { finishExam(true); return; }
    const q = getQuestion(exam.ids[exam.index]);
    const displayedQuestion = exam.wordings?.[q.id] || q.q;
    const isReworded = displayedQuestion !== q.q;
    const selected = exam.answers[q.id];
    const officialMode = (exam.mode || "mixed") === "official";
    layout(`<div class="question-shell">
      <div class="question-topbar"><div><strong>Examen blanc</strong><br><span>Question ${exam.index + 1} sur 40</span></div><span class="timer" id="exam-timer" role="timer">45:00</span></div>
      <div class="progress"><span style="--progress:${percent(Object.keys(exam.answers).length, 40) / 100}"></span></div>
      <div class="exam-map" aria-label="Navigation entre les questions">${exam.ids.map((id, i) => `<button type="button" data-exam-index="${i}" class="${i === exam.index ? "current" : ""} ${exam.answers[id] !== undefined ? "answered" : ""} ${exam.flagged.includes(id) ? "flagged" : ""}" aria-label="Question ${i + 1}${exam.answers[id] !== undefined ? ", répondue" : ""}" ${i === exam.index ? 'aria-current="step"' : ""}>${i + 1}</button>`).join("")}</div>
      <article class="question-card">
        <div>${tag(q)} ${officialMode ? '<span class="tag tag-official">Connaissance officielle · QCM adapté</span>' : ""} ${isReworded ? '<span class="tag tag-reworded">Formulation d’entraînement</span>' : ""}</div>${speechButton()}<h2>${displayedQuestion}</h2>
        <div class="choices">${q.choices.map((choice, i) => `<button class="choice ${selected === i ? "selected" : ""}" data-exam-choice="${i}" type="button" aria-pressed="${selected === i}"><span class="choice-letter">${LETTERS[i]}</span><span>${choice}</span></button>`).join("")}</div>
        <button class="flag-button" id="flag-question" type="button">${exam.flagged.includes(q.id) ? "Retirer le repère" : "Marquer pour y revenir"}</button>
        <div class="question-nav">
          <button class="button button-ghost" id="exam-prev" type="button" ${exam.index === 0 ? "disabled" : ""}>← Précédente</button>
          ${exam.index === 39 ? '<button class="button" id="finish-exam" type="button">Terminer l’examen</button>' : '<button class="button" id="exam-next" type="button">Suivante →</button>'}
        </div>
      </article>
    </div>`, true, !preserveScroll);
    startTimer();
    bindSpeechButton(displayedQuestion);
    document.querySelectorAll("[data-exam-choice]").forEach(btn => btn.addEventListener("click", () => {
      const choice = Number(btn.dataset.examChoice);
      exam = loadExam(); exam.answers[q.id] = choice; saveExam(exam); renderExamSession(true, `[data-exam-choice="${choice}"]`);
    }));
    document.querySelectorAll("[data-exam-index]").forEach(btn => btn.addEventListener("click", () => { exam = loadExam(); exam.index = Number(btn.dataset.examIndex); saveExam(exam); renderExamSession(false, ".question-card h2"); }));
    document.querySelector("#exam-prev").addEventListener("click", () => { exam = loadExam(); exam.index--; saveExam(exam); renderExamSession(false, ".question-card h2"); });
    document.querySelector("#exam-next")?.addEventListener("click", () => { exam = loadExam(); exam.index++; saveExam(exam); renderExamSession(false, ".question-card h2"); });
    document.querySelector("#flag-question").addEventListener("click", () => {
      exam = loadExam(); exam.flagged.includes(q.id) ? removeFrom(exam.flagged, q.id) : uniquePush(exam.flagged, q.id); saveExam(exam); renderExamSession(true, "#flag-question");
    });
    document.querySelector("#finish-exam")?.addEventListener("click", () => {
      const unanswered = 40 - Object.keys(loadExam().answers).length;
      if (!unanswered || confirm(`Il reste ${unanswered} question${unanswered > 1 ? "s" : ""} sans réponse. Terminer quand même ?`)) finishExam(false);
    });
    focusRendered(focusTarget);
  }

  function startTimer() {
    clearInterval(timerId);
    const update = () => {
      const exam = loadExam();
      if (!exam) { clearInterval(timerId); return; }
      const left = Math.max(0, exam.duration - (Date.now() - exam.startedAt));
      const minutes = Math.floor(left / 60000);
      const seconds = Math.floor((left % 60000) / 1000);
      const timer = document.querySelector("#exam-timer");
      if (timer) {
        timer.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
        timer.classList.toggle("warning", left < 5 * 60000);
      }
      if (!left) { clearInterval(timerId); finishExam(true); }
    };
    update(); timerId = window.setInterval(update, 1000);
  }

  function finishExam(timeUp) {
    clearInterval(timerId);
    const exam = loadExam();
    if (!exam) return;
    const score = exam.ids.reduce((sum, id) => sum + (exam.answers[id] === getQuestion(id).answer ? 1 : 0), 0);
    const result = { date: new Date().toISOString(), score, ids: exam.ids, answers: exam.answers, timeUp, mode: exam.mode || "mixed" };
    progress.exams.push({ date: result.date, score, mode: result.mode });
    if (progress.exams.length > 20) progress.exams = progress.exams.slice(-20);
    exam.ids.forEach(id => {
      uniquePush(progress.seen, id);
      if (exam.answers[id] !== getQuestion(id).answer) uniquePush(progress.review, id);
    });
    saveProgress();
    localStorage.removeItem(EXAM_KEY);
    sessionStorage.setItem("cap-citoyen-last-result", JSON.stringify(result));
    location.hash = "#/resultats";
  }

  function renderResults() {
    let result;
    try { result = JSON.parse(sessionStorage.getItem("cap-citoyen-last-result") || "null"); } catch (_) { result = null; }
    if (!result) { location.hash = "#/examen"; return; }
    const passed = result.score >= 32;
    const breakdown = Object.entries(themes).map(([id, theme]) => {
      const ids = result.ids.filter(qid => getQuestion(qid).theme === id);
      const correct = ids.filter(qid => result.answers[qid] === getQuestion(qid).answer).length;
      return `<div class="breakdown-row"><span>${theme.short}</span><div class="progress" style="--theme-color:${theme.color}"><span style="--progress:${percent(correct, ids.length) / 100}"></span></div><strong>${correct}/${ids.length}</strong></div>`;
    }).join("");
    const review = result.ids.map((id, index) => {
      const q = getQuestion(id); const choice = result.answers[id]; const good = choice === q.answer;
      return `<article class="review-item ${good ? "good" : "bad"}"><div>${tag(q)}</div><h3>${index + 1}. ${q.q}</h3><p><strong>Votre réponse :</strong> ${choice === undefined ? "Aucune réponse" : q.choices[choice]}</p>${!good ? `<p><strong>Bonne réponse :</strong> ${q.choices[q.answer]}</p>` : ""}<p>${q.explanation}</p>${glossaryKnowledge(q)}</article>`;
    }).join("");
    layout(`
      <div class="result-hero" style="--result-color:${passed ? "var(--green)" : "var(--orange)"}">
        <div class="score-ring" style="--score:${percent(result.score, 40)}%"><strong>${result.score}/40</strong></div>
        <p class="eyebrow">${result.timeUp ? "Temps écoulé · " : ""}Résultat</p>
        <h1>${passed ? "Examen blanc réussi" : "Encore un effort"}</h1>
        <p>${passed ? "Vous avez atteint le seuil de 80 %. Continuez à réviser pour stabiliser ce résultat." : `Il vous manque ${32 - result.score} bonne${32 - result.score > 1 ? "s" : ""} réponse${32 - result.score > 1 ? "s" : ""} pour atteindre le seuil.`}</p>
        <div class="actions" style="justify-content:center"><a class="button" href="#/examen">Nouvel examen</a><a class="button button-secondary" href="#/reviser?filter=review">Réviser mes erreurs</a></div>
      </div>
      <section class="breakdown"><h2>Résultat par thème</h2>${breakdown}</section>
      <section class="section"><div class="section-heading"><h2>Correction détaillée</h2></div><div class="review-list">${review}</div></section>
    `);
  }

  function renderSources() {
    layout(`
      <p class="eyebrow">Transparence</p>
      <h1>Sources officielles</h1>
      <p class="lead">Le contenu pédagogique a été élaboré à partir des documents officiels disponibles au 23 octobre 2026.</p>
      <div class="source-list">
        <article class="source-item"><h3>${sources.livret}</h3><p>Socle de connaissances sur les valeurs, l’histoire, les institutions et la vie en France.</p><a href="${sourceUrls.livret}" target="_blank" rel="noopener">Consulter sur Légifrance ↗</a></article>
        <article class="source-item"><h3>${sources.arrete}</h3><p>Format du QCM, durée, seuil de réussite et répartition des questions.</p><a href="${sourceUrls.arrete}" target="_blank" rel="noopener">Consulter sur Légifrance ↗</a></article>
        <article class="source-item"><h3>${sources.questions}</h3><p>Intitulés publics des questions de connaissance classés par thème.</p><a href="${sourceUrls.questions}" target="_blank" rel="noopener">Consulter sur le site du ministère ↗</a></article>
        <article class="source-item"><h3>${sources.procedure}</h3><p>Informations pratiques concernant l’examen et l’accès à la nationalité française.</p><a href="${sourceUrls.procedure}" target="_blank" rel="noopener">Consulter sur le site du ministère ↗</a></article>
        <article class="source-item"><h3>Jeu de données structuré et réponses pédagogiques</h3><p>Les 258 intitulés sont issus de la liste ministérielle. Les réponses proposées par leqcmcivique.fr sont indépendantes et diffusées sous Licence Ouverte 2.0.</p><a href="${sourceUrls.officialData}" target="_blank" rel="noopener">Consulter sur data.gouv.fr ↗</a></article>
        <article class="source-item"><h3>Glossaire des notions civiques</h3><p>Les 81 définitions, références juridiques et relations entre notions sont produites par examenciviquenaturalisation.fr, une initiative privée, et diffusées sous Licence Ouverte 2.0.</p><a href="${sourceUrls.glossaryData}" target="_blank" rel="noopener">Consulter le jeu de données sur data.gouv.fr ↗</a></article>
        <article class="source-item"><h3>Ressources d’approfondissement</h3><p>Un lien Wikipédia est proposé uniquement lorsqu’un article précis a été associé à la notion. Les recherches automatiques trop larges ont été supprimées. Cette ressource encyclopédique complète la révision, mais ne remplace jamais les textes officiels.</p><a href="https://fr.wikipedia.org" target="_blank" rel="noopener">Consulter Wikipédia ↗</a></article>
      </div>
      <div class="notice notice-warning"><strong>Important</strong>Cap Citoyen est un outil indépendant et non officiel. Les mises en situation proposées sont des créations pédagogiques : les questions officielles de mise en situation ne sont pas rendues publiques.</div>
    `, true);
  }

  function renderGlossary(params) {
    layout(`
      <h1>Glossaire des notions civiques</h1>
      <p class="lead">Chargement des définitions…</p>
      <div class="glossary-loading" role="status">Préparation du glossaire</div>
    `);

    loadGlossaryData()
      .then(data => {
        if (parseRoute().path !== "glossaire") return;
        renderGlossaryContent(data, params.get("notion"));
      })
      .catch(() => {
        if (parseRoute().path !== "glossaire") return;
        layout(`
          <h1>Glossaire des notions civiques</h1>
          <div class="notice notice-warning"><strong>Le glossaire n’a pas pu être chargé</strong>Vérifiez votre connexion puis rechargez cette page. S’il a déjà été ouvert, il reste normalement disponible hors connexion.</div>
          <button class="button" id="retry-glossary" type="button">Réessayer</button>
        `, true);
        document.querySelector("#retry-glossary").addEventListener("click", () => renderGlossary(params));
      });
  }

  function renderGlossaryContent(data, requestedSlug = null) {
    const themeLabels = Object.fromEntries(data.metadata.thematiques.map(theme => [theme.id, theme.libelle]));
    const entriesBySlug = new Map(data.entrees.map(entry => [entry.slug, entry]));
    const themeOptions = data.metadata.thematiques
      .map(theme => `<option value="${escapeHtml(theme.id)}">${escapeHtml(theme.libelle)}</option>`)
      .join("");

    layout(`
      <h1>Glossaire des notions civiques</h1>
      <p class="lead">Retrouvez 81 notions du programme, leur définition, leur référence juridique et les concepts associés.</p>
      <div class="notice"><strong>Origine des définitions</strong>Ce glossaire est produit par <a href="${escapeHtml(data.metadata.url_producteur)}" target="_blank" rel="noopener">examenciviquenaturalisation.fr <span aria-hidden="true">↗</span></a>, une initiative privée, et publié sous Licence Ouverte 2.0 sur <a href="${sourceUrls.glossaryData}" target="_blank" rel="noopener">data.gouv.fr <span aria-hidden="true">↗</span></a>. Il complète les sources officielles sans s’y substituer.</div>
      <div class="glossary-toolbar" role="search" aria-label="Rechercher dans le glossaire">
        <div class="field field-grow">
          <label for="glossary-search">Rechercher une notion</label>
          <input id="glossary-search" type="search" placeholder="Ex. laïcité, Parlement, Sécurité sociale" autocomplete="off" aria-controls="glossary-list">
        </div>
        <div class="field">
          <label for="glossary-theme">Thème</label>
          <select id="glossary-theme" aria-controls="glossary-list"><option value="all">Tous les thèmes</option>${themeOptions}</select>
        </div>
      </div>
      <p class="glossary-count" id="glossary-count" role="status" aria-live="polite"></p>
      <div class="glossary-list" id="glossary-list"></div>
      <p class="source-note">Version ${escapeHtml(data.metadata.version)} · Mise à jour du ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(`${data.metadata.date_mise_a_jour}T12:00:00`))}.</p>
    `);

    const search = document.querySelector("#glossary-search");
    const theme = document.querySelector("#glossary-theme");
    const count = document.querySelector("#glossary-count");
    const list = document.querySelector("#glossary-list");

    const renderEntries = () => {
      const query = normalizeSearch(search.value.trim());
      const selectedTheme = theme.value;
      const filtered = data.entrees.filter(entry => {
        const matchesTheme = selectedTheme === "all" || entry.thematique === selectedTheme;
        const searchable = normalizeSearch(`${entry.terme} ${entry.definition} ${entry.reference || ""}`);
        return matchesTheme && (!query || searchable.includes(query));
      });

      count.textContent = `${filtered.length} notion${filtered.length > 1 ? "s" : ""} affichée${filtered.length > 1 ? "s" : ""} sur ${data.entrees.length}`;
      if (!filtered.length) {
        list.innerHTML = '<div class="empty"><h2>Aucune notion trouvée</h2><p>Essayez un autre mot ou affichez tous les thèmes.</p><button class="button button-secondary" id="reset-glossary" type="button">Réinitialiser la recherche</button></div>';
        document.querySelector("#reset-glossary").addEventListener("click", () => {
          search.value = "";
          theme.value = "all";
          renderEntries();
          search.focus();
        });
        return;
      }

      list.innerHTML = filtered.map(entry => {
        const related = entry.termes_lies
          .map(slug => entriesBySlug.get(slug))
          .filter(Boolean)
          .map(item => `<a href="#/glossaire?notion=${encodeURIComponent(item.slug)}">${escapeHtml(item.terme)}</a>`)
          .join("");
        return `<details class="glossary-entry" id="notion-${escapeHtml(entry.slug)}">
          <summary><span class="glossary-term">${escapeHtml(entry.terme)}</span><span class="tag">${escapeHtml(themeLabels[entry.thematique] || entry.thematique)}</span></summary>
          <div class="glossary-content">
            <p>${escapeHtml(entry.definition)}</p>
            ${entry.reference ? `<p class="glossary-reference"><strong>Référence :</strong> ${escapeHtml(entry.reference)}</p>` : '<p class="glossary-reference"><strong>Référence :</strong> aucune référence juridique indiquée dans le jeu de données.</p>'}
            ${related ? `<div class="glossary-related"><strong>Notions associées</strong><div>${related}</div></div>` : ""}
          </div>
        </details>`;
      }).join("");
    };

    search.addEventListener("input", renderEntries);
    theme.addEventListener("change", renderEntries);
    renderEntries();

    if (requestedSlug && entriesBySlug.has(requestedSlug)) {
      window.requestAnimationFrame(() => {
        const target = document.querySelector(`#notion-${CSS.escape(requestedSlug)}`);
        if (!target) return;
        target.open = true;
        target.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
        target.querySelector("summary")?.focus({ preventScroll: true });
      });
    }
  }

  function renderPrivacy() {
    layout(`
      <p class="eyebrow">Vie privée</p>
      <h1>Vos révisions restent sur votre appareil</h1>
      <p class="lead">Cap Citoyen ne demande pas de compte et n’utilise ni publicité, ni outil de mesure d’audience, ni traceur de profilage.</p>

      <div class="privacy-list">
        <section class="privacy-section">
          <h2>Données enregistrées localement</h2>
          <p>Votre progression, les cartes à revoir, les échéances de répétition espacée, la session d’examen en cours, votre préférence de thème et la version technique de l’application sont enregistrées dans le stockage de votre navigateur.</p>
          <p>Ces informations servent uniquement à retrouver votre parcours sur cet appareil. Le code de Cap Citoyen ne les transmet à aucun serveur et ne peut pas les synchroniser avec un autre appareil.</p>
        </section>

        <section class="privacy-section">
          <h2>Mode hors connexion</h2>
          <p>L’application conserve dans un cache technique les fichiers publics nécessaires à son fonctionnement : pages, styles, scripts, icônes, banque de questions et glossaire. Ce cache ne contient pas votre identité ni votre progression.</p>
          <p>Il permet d’ouvrir les flashcards et les examens blancs sans connexion. Le navigateur le remplace lorsqu’une nouvelle version de l’application est disponible.</p>
        </section>

        <section class="privacy-section">
          <h2>Hébergement et liens externes</h2>
          <p>Le site est distribué par Netlify. Comme tout hébergeur, Netlify peut traiter les données techniques nécessaires à la livraison et à la sécurisation du service selon sa propre politique de confidentialité.</p>
          <p>Les sites externes cités dans les sources ne sont contactés que lorsque vous choisissez d’ouvrir leurs liens.</p>
          <p><a href="https://www.netlify.com/privacy/" target="_blank" rel="noopener">Consulter la politique de confidentialité de Netlify <span aria-hidden="true">↗</span></a></p>
        </section>

        <section class="privacy-section">
          <h2>Consentement et suppression</h2>
          <p>Le stockage utilisé est limité aux fonctions demandées — mémoriser votre progression, votre présentation et rendre l’application disponible hors ligne. Aucun bandeau de consentement publicitaire ou statistique n’est donc affiché.</p>
          <p><a href="https://www.cnil.fr/fr/cookies-et-autres-traceurs/que-dit-la-loi" target="_blank" rel="noopener">Comprendre les règles relatives aux traceurs sur le site de la CNIL <span aria-hidden="true">↗</span></a></p>
          <p>Vous pouvez réinitialiser vos données ci-dessous ou supprimer toutes les données du site depuis les réglages de votre navigateur. Désinstaller l’application ne supprime pas nécessairement les données du navigateur associé.</p>
          <button class="button button-danger" id="erase-local-data" type="button">Effacer ma progression et mes préférences</button>
        </section>
      </div>

      <div class="notice"><strong>Notre engagement actuel</strong>Si un outil d’analyse, une publicité, un compte utilisateur ou une synchronisation en ligne est ajouté ultérieurement, cette page et le mécanisme de consentement seront réévalués avant sa mise en service.</div>
      <p class="source-note">Dernière mise à jour : 23 octobre 2026.</p>
    `, true);

    document.querySelector("#erase-local-data").addEventListener("click", () => {
      if (!confirm("Effacer la progression, l’examen en cours et les préférences enregistrées sur cet appareil ?")) return;
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(EXAM_KEY);
      localStorage.removeItem("cap-citoyen-theme");
      localStorage.removeItem("cap-citoyen-app-version");
      sessionStorage.removeItem("cap-citoyen-last-result");
      progress = initialProgress();
      saveProgress();
      setupTheme();
      toast("Données locales réinitialisées");
    });
  }

  function renderNotFound() {
    layout('<div class="empty"><p class="eyebrow">Erreur 404</p><h1>Cette page n’existe pas</h1><a class="button" href="#/">Retour à l’accueil</a></div>', true);
  }

  async function router() {
    clearInterval(timerId);
    stopSpeech();
    const { path, params } = parseRoute();
    const routeHash = location.hash;
    if (["reviser", "entrainement", "resultats"].includes(path) && !glossaryData) {
      layout('<div class="glossary-loading" role="status">Préparation des ressources pédagogiques…</div>', true);
      try { await loadGlossaryData(); } catch (_) { /* Le parcours reste utilisable sans le complément. */ }
      if (location.hash !== routeHash) return;
    }
    setActiveNav(path);
    if (path === "home") renderHome();
    else if (path === "reviser") renderRevise(params);
    else if (path === "entrainement") renderPractice();
    else if (path === "examen") renderExamLanding();
    else if (path === "resultats") renderResults();
    else if (path === "glossaire") renderGlossary(params);
    else if (path === "sources") renderSources();
    else if (path === "confidentialite") renderPrivacy();
    else renderNotFound();
    document.querySelector("#main").focus({ preventScroll: true });
  }

  function setupTheme() {
    const saved = localStorage.getItem("cap-citoyen-theme");
    const dark = saved ? saved === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    updateThemeLabel();
  }

  function updateThemeLabel() {
    const button = document.querySelector(".theme-toggle");
    const dark = document.documentElement.dataset.theme === "dark";
    button.setAttribute("aria-label", dark ? "Activer le thème clair" : "Activer le thème sombre");
    document.querySelector('meta[name="theme-color"]').setAttribute("content", dark ? "#1e1e1e" : "#000091");
  }

  document.querySelector(".theme-toggle").addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("cap-citoyen-theme", next);
    updateThemeLabel();
  });

  document.querySelector("#reset-progress").addEventListener("click", () => {
    if (!confirm("Supprimer toute la progression enregistrée sur cet appareil ?")) return;
    localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(EXAM_KEY); sessionStorage.removeItem("cap-citoyen-last-result");
    progress = initialProgress(); saveProgress(); toast("Progression réinitialisée"); location.hash = "#/"; router();
  });

  window.addEventListener("hashchange", router);
  setupTheme();
  if (!location.hash) location.hash = "#/";
  else router();
})();
