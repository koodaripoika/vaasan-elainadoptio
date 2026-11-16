-- Tietokannan alustus
-- Postgresin Docker-image ajaa tämän tiedoston automaattisesti, kun kontti
-- käynnistyy ensimmäistä kertaa (tiedosto on kansiossa /docker-entrypoint-initdb.d)

-- Eläimet
CREATE TABLE animals (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,          -- kissa, koira, kani, lintu...
    age INTEGER,                        -- vuosina
    breed VARCHAR(100),
    description TEXT,
    image_url TEXT,                     -- saa olla tyhjä, silloin sivulla näytetään placeholder-kuva
    likes INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'available'   -- 'available' = vapaana, 'adopted' = adoptoitu
);

-- Adoptiohakemukset
-- animal_id on viiteavain animals-tauluun. UNIQUE on siksi, että samaa eläintä
-- ei voi adoptoida kahteen kertaan, vaikka palvelimen tarkistus jostain syystä pettäisi
CREATE TABLE adoptions (
    id SERIAL PRIMARY KEY,
    animal_id INTEGER NOT NULL UNIQUE REFERENCES animals(id),
    applicant_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Esimerkkidata
-- Kuvat on Unsplashista. Parille eläimelle en laittanut kuvaa ollenkaan,
-- niin näkee että placeholder toimii
INSERT INTO animals (name, type, age, breed, description, image_url) VALUES
('Musti', 'koira', 4, 'Beaglesekoitus',
 'Iloinen ja utelias koira, joka rakastaa pitkiä lenkkejä ja nenätyöskentelyä. Tulee hyvin toimeen muiden koirien kanssa. Sopisi aktiiviseen perheeseen.',
 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600'),

('Mirri', 'kissa', 2, 'Maatiaiskissa',
 'Rauhallinen ja hellyydenkipeä kissa. Tykkää istua sylissä ja seurata ikkunasta lintuja. Tottunut sisäkissan elämään.',
 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600'),

('Rekku', 'koira', 6, 'Australianpaimenkoira',
 'Fiksu ja nopea oppimaan. Rekku tarvitsee paljon liikuntaa ja tekemistä, joten se sopii parhaiten kokeneelle koiraihmiselle.',
 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600'),

('Viiru', 'kissa', 8, 'Maatiaiskissa',
 'Vanhempi herrasmies, joka arvostaa rauhaa ja hyvää ruokaa. Ei ole kovin innostunut pienistä lapsista, mutta aikuisten kanssa tosi kiltti.',
 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=600'),

('Pörrö', 'kani', 1, 'Luppakorvakani',
 'Nuori ja pirteä kani. Tykkää juoksennella ja syödä tuoreita vihanneksia. Kaipaa tilavan häkin tai oman huoneen.',
 'https://images.unsplash.com/photo-1452857297128-d9c29adba80b?w=600'),

('Topi', 'koira', 3, 'Jackrussellinterrieri',
 'Pieni mutta täynnä energiaa. Topi rakastaa palloleikkejä ja on aina mukana kaikessa. Ei sovi kissojen kanssa samaan talouteen.',
 'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=600'),

('Kurre', 'kissa', 5, 'Maatiaiskissa',
 'Leikkisä oranssi kolli, joka jaksaa jahdata narua tuntikausia. Tulee hyvin toimeen toisten kissojen kanssa.',
 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=600'),

('Nappi', 'koira', 9, 'Mopsi',
 'Seniorikoira, joka nauttii lyhyistä kävelyistä ja pitkistä päiväunista. Etsii rauhallista kotia, jossa saa olla paljon sohvalla.',
 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=600'),

('Hippu', 'kani', 2, 'Hermeliinikani',
 'Vähän arka aluksi, mutta kun tutustuu niin todella sosiaalinen. Sopisi rauhalliseen kotiin.',
 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=600'),

('Sulo', 'lintu', 3, 'Undulaatti',
 'Puhelias undulaatti, joka osaa jo muutaman sanan. Tarvitsee seuraa, joten mieluiten kotiin jossa on jo toinen lintu.',
 NULL),

('Misu', 'kissa', 3, 'Maatiaiskissa',
 'Ujo kissa, joka tarvitsee aikaa tottuakseen uusiin ihmisiin. Kun luottamus on saatu, Misu on tosi kiintynyt omistajaansa.',
 NULL),

('Kulta', 'koira', 1, 'Kultaisennoutajan sekoitus',
 'Nuori ja innokas pentu, joka oppii uusia asioita nopeasti. Tarvitsee vielä pentukoulua ja paljon huomiota.',
 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600');
