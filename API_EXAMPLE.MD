
Theme Parks Wiki V1 API

 1.0.4 

OAS3

/docs/v1.yaml

The Theme Parks Wiki API provides a live data feed for theme parks around the world. This API is designed to be a simple, easy-to-use interface for developers to access live data from theme parks.

This API is provided by ThemeParks.Wiki, a community-driven project that aims to provide accurate, up-to-date information about theme parks around the world. The API is free to use. We hope you find the API useful, and we look forward to seeing what you build with it!

Please consider becoming a GitHub Sponsor if this API is useful to you. This project only remains online thanks to your support. Thank you!

GitHub Sponsors
Servers
Destinations

Operations related to destinations. All parks and attractions are grouped under a destination.
GET
/destinations
Get a list of supported destinations available on the live API
Entities

Operations related to entities (parks, attractions, etc.)
GET
/entity/{entityID}
Get entity document

Get the full data document for a given entity. You can supply either a GUID or slug string.
Parameters
Name	Description
entityID *
string
(path)
	

Entity ID (or slug) to fetch
Responses
Curl

curl -X 'GET' \
  'https://api.themeparks.wiki/v1/entity/e8d0207f-da8a-4048-bec8-117aa946b2c2' \
  -H 'accept: application/json'

Request URL

https://api.themeparks.wiki/v1/entity/e8d0207f-da8a-4048-bec8-117aa946b2c2

Server response
Code	Details
200	
Response body
Download

{
  "id": "e8d0207f-da8a-4048-bec8-117aa946b2c2",
  "name": "Disneyland Paris",
  "slug": "disneylandparis",
  "location": {
    "latitude": 48.86872,
    "longitude": 2.781826
  },
  "timezone": "Europe/Paris",
  "entityType": "DESTINATION",
  "externalId": "dlp"
}

Response headers

 access-control-allow-origin: *  alt-svc: h3=":443"; ma=86400  cache-control: public,max-age=60,s-maxage=3600  cf-cache-status: DYNAMIC  cf-ray: 978b533f6b58751f-AMS  content-encoding: zstd  content-type: application/json; charset=utf-8  date: Tue,02 Sep 2025 07:34:29 GMT  etag: W/"10a-B2f1ROAa/edneS6DnsuMNP/GEDY"  nel: {"report_to":"heroku-nel","response_headers":["Via"],"max_age":3600,"success_fraction":0.01,"failure_fraction":0.1}  report-to: {"group":"heroku-nel","endpoints":[{"url":"https://nel.heroku.com/reports?s=h16zeT7SCci6Up2HiplCR5z92Iopit18Pt4Atv5jrJU%3D\u0026sid=812dcc77-0bd0-43b1-a5f1-b25750382959\u0026ts=1756798469"}],"max_age":3600}  reporting-endpoints: heroku-nel="https://nel.heroku.com/reports?s=h16zeT7SCci6Up2HiplCR5z92Iopit18Pt4Atv5jrJU%3D&sid=812dcc77-0bd0-43b1-a5f1-b25750382959&ts=1756798469"  server: cloudflare  server-timing: cfL4;desc="?proto=TCP&rtt=26674&min_rtt=6468&rtt_var=25104&sent=100&recv=76&lost=0&retrans=1&sent_bytes=67510&recv_bytes=7187&delivery_rate=3632844&cwnd=255&unsent_bytes=0&cid=25fd2af67d2c1622&ts=331873&x=0"  strict-transport-security: max-age=2592000  vary: Accept-Encoding  via: 2.0 heroku-router  x-firefox-spdy: h2 

Responses
Code	Description	Links
200	

successful fetch
Media type
Controls Accept header.

{
  "id": "string",
  "name": "string",
  "entityType": "DESTINATION",
  "parentId": "string",
  "destinationId": "string",
  "timezone": "string",
  "location": {
    "latitude": 0,
    "longitude": 0
  },
  "tags": [
    {
      "tag": "string",
      "tagName": "string",
      "id": "string",
      "value": "string"
    }
  ]
}

	No links
GET
/entity/{entityID}/children
Get all children for a given entity document

Fetch a list of all the children that belong to this entity. This is recursive, so a destination will return all parks and all rides within those parks.
Parameters
Name	Description
entityID *
string
(path)
	

Entity ID (or slug) to fetch
Responses
Curl

curl -X 'GET' \
  'https://api.themeparks.wiki/v1/entity/e8d0207f-da8a-4048-bec8-117aa946b2c2/children' \
  -H 'accept: application/json'

Request URL

https://api.themeparks.wiki/v1/entity/e8d0207f-da8a-4048-bec8-117aa946b2c2/children

Server response
Code	Details
200	
Response body
Download

{
  "id": "e8d0207f-da8a-4048-bec8-117aa946b2c2",
  "name": "Disneyland Paris",
  "entityType": "DESTINATION",
  "timezone": "Europe/Paris",
  "children": [
    {
      "id": "d75b7092-0bf9-4a94-bef9-2c9979b8a889",
      "name": "The Hollywood Gardens Restaurant",
      "entityType": "RESTAURANT",
      "slug": null,
      "parentId": "ca888437-ebb4-4d50-aed2-d227f7096968",
      "externalId": "P2FR00",
      "location": {
        "longitude": 2.779479,
        "latitude": 48.867756
      }
    },
    {
      "id": "3954d4fe-3420-4df8-926c-aa2b0cc89853",
      "name": "Cool Post ",
      "entityType": "RESTAURANT",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1AR05",
      "location": {
        "longitude": 2.773866,
        "latitude": 48.871928
      }
    },
    {
      "id": "107f3630-8658-47ae-8106-67d088902471",
      "name": "The Coffee Grinder",
      "entityType": "RESTAURANT",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1MR02",
      "location": {
        "longitude": 2.778346,
        "latitude": 48.871823
      }
    },
    {
      "id": "b1d843de-80b6-4ee1-bfd4-54d40f6026e7",
      "name": "Cookie Kitchen",
      "entityType": "RESTAURANT",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1MR03",
      "location": {
        "longitude": 2.777805,
        "latitude": 48.871931
      }
    },
    {
      "id": "98e16089-4a95-4565-830a-faf5f730272d",
      "name": "Restaurant Hakuna Matata",
      "entityType": "RESTAURANT",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1AR07",
      "location": {
        "longitude": 2.774473,
        "latitude": 48.87206
      }
    },
    {
      "id": "ef54a7f3-8276-4879-a431-0b9f9219ac78",
      "name": "Cool Station",
      "entityType": "RESTAURANT",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1DR02",
      "location": {
        "longitude": 2.7781,
        "latitude": 48.87327
      }
    },
    {
      "id": "98e395e6-4a32-4995-98f2-ff766d86c368",
      "name": "Cable Car Bake Shop",
      "entityType": "RESTAURANT",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1MR00",
      "location": {
        "longitude": 2.777754,
        "latitude": 48.871975
      }
    },
    {
      "id": "5b3c8ce8-e773-4f4c-a508-cadde75188ce",
      "name": "Market House Deli",
      "entityType": "RESTAURANT",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1MR06",
      "location": {
        "longitude": 2.778021,
        "latitude": 48.871782
      }
    },
    {
      "id": "5b492a0f-7c9f-4c82-b6dc-4d1be20f7b1e",
      "name": "Plaza Gardens Restaurant",
      "entityType": "RESTAURANT",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1MR08",
      "location": {
        "longitude": 2.77778,
        "latitude": 48.872605
      }
    },
    {
      "id": "f47b8d8b-a5a7-4f8c-a1ef-759621a5ee81",
      "name": "Victoria’s Home-Style Restaurant",
      "entityType": "RESTAURANT",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1MR09",
      "location": {
        "longitude": 2.777851,
        "latitude": 48.872251
      }
    },
    {
      "id": "ca17a056-3f23-41d2-babb-af6b178a9456",
      "name": "Walt’s – an American restaurant",
      "entityType": "RESTAURANT",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1MR10",
      "location": {
        "longitude": 2.777713,
        "latitude": 48.871732
      }
    },
    {
      "id": "4a0db383-6bb7-49e2-bc1e-06997e65325f",
      "name": "Pizzeria Bella Notte",
      "entityType": "RESTAURANT",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1NR06",
      "location": {
        "longitude": 2.776468,
        "latitude": 48.874315
      }
    },
    {
      "id": "5bd7aa6a-69f5-443a-8c8a-e007678336d8",
      "name": "L'Arbre Enchanté",
      "entityType": "RESTAURANT",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1NR00",
      "location": {
        "longitude": 2.775522,
        "latitude": 48.874138
      }
    },
    {
      "id": "616bc6d6-5a14-4d39-90c3-88f6d61e5fd6",
      "name": "Auberge de Cendrillon",
      "entityType": "RESTAURANT",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1NR01",
      "location": {
        "longitude": 2.775783576071262,
        "latitude": 48.8736571395232
      }
    },
    {
      "id": "e9124220-9699-4014-8e65-06cad9814a5b",
      "name": "Au Chalet de la Marionnette",
      "entityType": "RESTAURANT",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1NR02",
      "location": {
        "longitude": 2.774677,
        "latitude": 48.873528
      }
    },
    {
      "id": "c7773e1f-c75d-4ab8-b6e6-a797abfa82d9",
      "name": "March Hare Refreshments",
      "entityType": "RESTAURANT",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1NR04",
      "location": {
        "longitude": 2.77489,
        "latitude": 48.874474
      }
    },
    {
      "id": "290f42d3-46bd-4cd1-b69d-891788b0afdb",
      "name": "Speciality Ice Cream",
      "entityType": "RESTAURANT",
      "slug": null,
      "parentId": "ca888437-ebb4-4d50-aed2-d227f7096968",
      "externalId": "P2BR04",
      "location": {
        "longitude": 2.778548,
        "latitude": 48.867123
      }
    },
    {
      "id": "ac95f062-776b-48d9-bc77-869a9307dac7",
      "name": "Last Chance Cafe",
      "entityType": "RESTAURANT",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1RR02",
      "location": {
        "longitude": 2.776634,
        "latitude": 48.871533
      }
    },
    {
      "id": "04123960-2968-4bea-ac47-c9aeba4ed581",
      "name": "The Lucky Nugget Saloon",
      "entityType": "RESTAURANT",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1RR03",
      "location": {
        "longitude": 2.776365,
        "latitude": 48.871646
      }
    },
    {
      "id": "222aa656-ac33-457c-8193-7c625949f40e",
      "name": "Silver Spur Steakhouse",
      "entityType": "RESTAURANT",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1RR04",
      "location": {
        "longitude": 2.776632,
        "latitude": 48.871262
      }
    },
    {
      "id": "7d0660a9-cc08-45c0-9ab7-2699f5369771",
      "name": "Disney Tales of Magic",
      "entityType": "SHOW",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1GS99",
      "location": {
        "longitude": 2.776469886302948,
        "latitude": 48.87284356722657
      }
    },
    {
      "id": "7dae6b67-0da8-4cb6-8e6e-fb2c2f262a4d",
      "name": "Stark Factory",
      "entityType": "RESTAURANT",
      "slug": null,
      "parentId": "ca888437-ebb4-4d50-aed2-d227f7096968",
      "externalId": "P2AR01",
      "location": {
        "longitude": 2.7800833333333332,
        "latitude": 48.8656667
      }
    },
    {
      "id": "5f492609-5f79-4ca2-a3ca-39cdd0438739",
      "name": "PYM Kitchen",
      "entityType": "RESTAURANT",
      "slug": null,
      "parentId": "ca888437-ebb4-4d50-aed2-d227f7096968",
      "externalId": "P2AR02",
      "location": {
        "longitude": 2.7796389,
        "latitude": 48.866
      }
    },
    {
      "id": "4f146287-77e4-4e92-a137-f6e0cff1091f",
      "name": "Lounge Lightspeed",
      "entityType": "RESTAURANT",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1DR04",
      "location": {
        "longitude": 2.778907,
        "latitude": 48.874622
      }
    },
    {
      "id": "73e1c590-ef8f-496c-bf6c-d7e7fde0c7df",
      "name": "Ratatouille : L’Aventure Totalement Toquée de Rémy​",
      "entityType": "ATTRACTION",
      "slug": null,
      "parentId": "ca888437-ebb4-4d50-aed2-d227f7096968",
      "externalId": "P2XA09",
      "location": {
        "longitude": 2.7762224525213237,
        "latitude": 48.86757046243673
      }
    },
    {
      "id": "0d9296c0-a76c-4578-b0f9-2ff4b4e385b5",
      "name": "Disneyland Railroad Main Street Station",
      "entityType": "ATTRACTION",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1MA01",
      "location": {
        "longitude": 2.779071,
        "latitude": 48.870821
      }
    },
    {
      "id": "c8e304bd-876d-46e2-a412-7f8bc1e73a09",
      "name": "Colonel Hathi’s Outpost Restaurant ",
      "entityType": "RESTAURANT",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1AR03",
      "location": {
        "longitude": 2.773429,
        "latitude": 48.87174
      }
    },
    {
      "id": "3a1cd3f7-9c42-4f9b-90fa-dab7ba113862",
      "name": "Autopia, presented by Avis",
      "entityType": "ATTRACTION",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1DA03",
      "location": {
        "longitude": 2.778797,
        "latitude": 48.873417
      }
    },
    {
      "id": "ca888437-ebb4-4d50-aed2-d227f7096968",
      "name": "Walt Disney Studios Park",
      "entityType": "PARK",
      "slug": "waltdisneystudiospark",
      "parentId": "e8d0207f-da8a-4048-bec8-117aa946b2c2",
      "externalId": "P2",
      "location": {
        "longitude": 2.780802,
        "latitude": 48.868391
      }
    },
    {
      "id": "9056906c-0030-4951-be5e-44ac1f273491",
      "name": "Le Pays des Contes de Fées, presented by Vittel",
      "entityType": "ATTRACTION",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1NA09",
      "location": {
        "longitude": 2.774483,
        "latitude": 48.87519
      }
    },
    {
      "id": "69ab4a1d-725e-4bdc-8284-7c076001b523",
      "name": "Rocket Café",
      "entityType": "RESTAURANT",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1DR03",
      "location": {
        "longitude": 2.7796104146805023,
        "latitude": 48.87435811100483
      }
    },
    {
      "id": "2060c5ac-2ca2-48d0-9772-8f1b5fd3a702",
      "name": "Critter Corral",
      "entityType": "RESTAURANT",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1RR05",
      "location": {
        "longitude": 2.7722850000000108,
        "latitude": 48.870677
      }
    },
    {
      "id": "7a696f1b-c72d-48ec-b877-2c66c94e7e75",
      "name": "Guardians of the Galaxy: Dance Challenge! ",
      "entityType": "SHOW",
      "slug": null,
      "parentId": "ca888437-ebb4-4d50-aed2-d227f7096968",
      "externalId": "guardiansOfGalaxy",
      "location": {
        "longitude": 2.781826,
        "latitude": 48.86872
      }
    },
    {
      "id": "20e0430d-a0d4-4bbf-a5da-b6cff3ffd23a",
      "name": "Searchlight",
      "entityType": "RESTAURANT",
      "slug": null,
      "parentId": "ca888437-ebb4-4d50-aed2-d227f7096968",
      "externalId": "P2FR02",
      "location": {
        "longitude": 2.779616,
        "latitude": 48.867534
      }
    },
    {
      "id": "dd0f02c0-3714-47e2-b761-086cd752b207",
      "name": "Café de la Brousse",
      "entityType": "RESTAURANT",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1AR01",
      "location": {
        "longitude": 2.77452,
        "latitude": 48.872371
      }
    },
    {
      "id": "ee25803b-51b1-4c67-86c3-eb4121c2ca8c",
      "name": "Overland Trail Cafe",
      "entityType": "RESTAURANT",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1GR46",
      "location": {
        "longitude": 2.774965,
        "latitude": 48.87168
      }
    },
    {
      "id": "2683a803-03c4-48b6-9bbd-a7298400a675",
      "name": "Café Hyperion",
      "entityType": "RESTAURANT",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1DR01",
      "location": {
        "longitude": 2.778097,
        "latitude": 48.874057
      }
    },
    {
      "id": "d0f981f2-9813-45a4-a623-a34380247b62",
      "name": "Toad Hall Restaurant",
      "entityType": "RESTAURANT",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1NR07",
      "location": {
        "longitude": 2.773769,
        "latitude": 48.874154
      }
    },
    {
      "id": "4b2f71bd-332b-478c-8cd0-8627b3ec13fc",
      "name": "Cowboy Cookout Barbecue",
      "entityType": "RESTAURANT",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1RR00",
      "location": {
        "longitude": 2.773392,
        "latitude": 48.871027
      }
    },
    {
      "id": "6528b0e3-0e49-44f8-a2ca-b135a4d267a4",
      "name": "Bistrot Chez Rémy",
      "entityType": "RESTAURANT",
      "slug": null,
      "parentId": "ca888437-ebb4-4d50-aed2-d227f7096968",
      "externalId": "P2TR02",
      "location": {
        "longitude": 2.775793,
        "latitude": 48.867463
      }
    },
    {
      "id": "8598d1c9-9693-4b10-a7a8-50077ba62a3f",
      "name": "Captain Jack's - Restaurant des Pirates",
      "entityType": "RESTAURANT",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1AR00",
      "location": {
        "longitude": 2.772994,
        "latitude": 48.873306
      }
    },
    {
      "id": "d5c26c67-691b-4250-985f-fdda5e5ac233",
      "name": "Casey’s Corner",
      "entityType": "RESTAURANT",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1MR01",
      "location": {
        "longitude": 2.777476,
        "latitude": 48.871983
      }
    },
    {
      "id": "5ae7196f-3096-478b-b602-b8fe49d964ea",
      "name": "The Gibson Girl Ice Cream Parlour",
      "entityType": "RESTAURANT",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1MR04",
      "location": {
        "longitude": 2.77763,
        "latitude": 48.8721
      }
    },
    {
      "id": "678d76cf-6b24-40ec-a536-26c3667745e8",
      "name": "The Ice Cream Company",
      "entityType": "RESTAURANT",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1MR05",
      "location": {
        "longitude": 2.778292,
        "latitude": 48.871845
      }
    },
    {
      "id": "4459f001-9dfe-4ddc-844a-6ae0e7bc36d5",
      "name": "The Old Mill",
      "entityType": "RESTAURANT",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1NR05",
      "location": {
        "longitude": 2.775106,
        "latitude": 48.874859
      }
    },
    {
      "id": "80283731-cd16-42fe-860e-28c70de9e59c",
      "name": "Super Diner",
      "entityType": "RESTAURANT",
      "slug": null,
      "parentId": "ca888437-ebb4-4d50-aed2-d227f7096968",
      "externalId": "P2AR03",
      "location": {
        "longitude": 2.778520018942506,
        "latitude": 48.86589278028716
      }
    },
    {
      "id": "e133de74-a086-4991-9ad9-6b72368447bd",
      "name": "Casa de Coco – Restaurante de Familia",
      "entityType": "RESTAURANT",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1RR01",
      "location": {
        "longitude": 2.774558,
        "latitude": 48.871664
      }
    },
    {
      "id": "81705034-f093-4853-b76e-b1e3bb51fade",
      "name": "Alice & the Queen of Hearts: Back to Wonderland ",
      "entityType": "SHOW",
      "slug": null,
      "parentId": "ca888437-ebb4-4d50-aed2-d227f7096968",
      "externalId": "P2GS59",
      "location": {
        "longitude": 2.7782803773880005,
        "latitude": 48.86485650680615
      }
    },
    {
      "id": "679f0091-d7f9-4b09-85bf-75827abb6219",
      "name": "FAN-tastic Food Truck",
      "entityType": "RESTAURANT",
      "slug": null,
      "parentId": "ca888437-ebb4-4d50-aed2-d227f7096968",
      "externalId": "P2BR02",
      "location": {
        "longitude": 2.778419852256775,
        "latitude": 48.86570196868203
      }
    },
    {
      "id": "460759ef-bceb-4e07-bdaa-7d1ab81e1413",
      "name": "WEB Food Truck",
      "entityType": "RESTAURANT",
      "slug": null,
      "parentId": "ca888437-ebb4-4d50-aed2-d227f7096968",
      "externalId": "P2PR05",
      "location": {
        "longitude": 2.778975069522857,
        "latitude": 48.86552376119522
      }
    },
    {
      "id": "2d2e9053-4eba-4d44-a343-f88570c0513f",
      "name": "Ice Cream Creations",
      "entityType": "RESTAURANT",
      "slug": null,
      "parentId": "ca888437-ebb4-4d50-aed2-d227f7096968",
      "externalId": "P2TR00",
      "location": {
        "longitude": 2.779329,
        "latitude": 48.867224
      }
    },
    {
      "id": "1c04ec07-13c2-4d83-af15-6d9bac387db1",
      "name": "Laugh’N' Go!",
      "entityType": "RESTAURANT",
      "slug": null,
      "parentId": "ca888437-ebb4-4d50-aed2-d227f7096968",
      "externalId": "P2VK00",
      "location": {
        "longitude": 2.775209,
        "latitude": 48.866625
      }
    },
    {
      "id": "3a91b818-cb5f-4900-b93e-c67e25f5956d",
      "name": "Agrabah Café Restaurant",
      "entityType": "RESTAURANT",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1AR06",
      "location": {
        "longitude": 2.775236,
        "latitude": 48.87277
      }
    },
    {
      "id": "e7e211f7-c1c5-466b-934a-d9891ba6547e",
      "name": "Character Dining at Plaza Gardens Restaurant",
      "entityType": "RESTAURANT",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1MR12",
      "location": {
        "longitude": 2.778027,
        "latitude": 48.872605
      }
    },
    {
      "id": "f710814b-232d-4469-aad7-d98b328a15b7",
      "name": "Spider-Man W.E.B. Adventure",
      "entityType": "ATTRACTION",
      "slug": null,
      "parentId": "ca888437-ebb4-4d50-aed2-d227f7096968",
      "externalId": "P2AC02",
      "location": {
        "longitude": 2.779369354248047,
        "latitude": 48.86611484299536
      }
    },
    {
      "id": "ff2e7d6f-5aaf-47b8-8695-53a66e9fe073",
      "name": "Avengers Assemble: Flight Force",
      "entityType": "ATTRACTION",
      "slug": null,
      "parentId": "ca888437-ebb4-4d50-aed2-d227f7096968",
      "externalId": "P2AC01",
      "location": {
        "longitude": 2.7794149518013,
        "latitude": 48.86544789048844
      }
    },
    {
      "id": "62d616e5-e580-431d-9a21-5c377e8cd484",
      "name": "Warriors of Wakanda",
      "entityType": "SHOW",
      "slug": null,
      "parentId": "ca888437-ebb4-4d50-aed2-d227f7096968",
      "externalId": "warriorsOfwakanda",
      "location": {
        "longitude": 2.781826,
        "latitude": 48.86872
      }
    },
    {
      "id": "dae968d5-630d-4719-8b06-3d107e944401",
      "name": "Disneyland Park",
      "entityType": "PARK",
      "slug": "disneylandpark",
      "parentId": "e8d0207f-da8a-4048-bec8-117aa946b2c2",
      "externalId": "P1",
      "location": {
        "longitude": 2.779913,
        "latitude": 48.870205
      }
    },
    {
      "id": "ce87a0fe-c644-475e-abb6-9727e05cebff",
      "name": "\"it's a small world\"",
      "entityType": "ATTRACTION",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1NA07",
      "location": {
        "longitude": 2.776084,
        "latitude": 48.87469
      }
    },
    {
      "id": "63dfcdab-86c2-4185-99b1-5a353d81bb52",
      "name": "Adventure Isle",
      "entityType": "ATTRACTION",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1AA00",
      "location": {
        "longitude": 2.77316,
        "latitude": 48.872736
      }
    },
    {
      "id": "252b9b03-f770-4979-b3b2-f4ffecc3894d",
      "name": "Alice's Curious Labyrinth",
      "entityType": "ATTRACTION",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1NA00",
      "location": {
        "longitude": 2.774518,
        "latitude": 48.874461
      }
    },
    {
      "id": "852d957c-382e-4afb-bb74-70c9a79055df",
      "name": "Big Thunder Mountain",
      "entityType": "ATTRACTION",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1RA00",
      "location": {
        "longitude": 2.774787,
        "latitude": 48.871528
      }
    },
    {
      "id": "8ed1472a-4d2e-47f1-b848-353de0bc3670",
      "name": "Blanche-Neige et les Sept Nains®",
      "entityType": "ATTRACTION",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1NA01",
      "location": {
        "longitude": 2.775298,
        "latitude": 48.873445
      }
    },
    {
      "id": "03992704-698d-474b-a721-a5ac3498edb9",
      "name": "Buzz Lightyear Laser Blast",
      "entityType": "ATTRACTION",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1DA04",
      "location": {
        "longitude": 2.777947,
        "latitude": 48.87343
      }
    },
    {
      "id": "7ff5d512-aed5-479a-8b3d-9bd1efb4177b",
      "name": "Casey Jr. – le Petit Train du Cirque",
      "entityType": "ATTRACTION",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1NA03",
      "location": {
        "longitude": 2.774151,
        "latitude": 48.875176
      }
    },
    {
      "id": "7d90d4e6-8c15-44ee-9e94-feb07788f02f",
      "name": "Discovery Arcade",
      "entityType": "ATTRACTION",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1MA00",
      "location": {
        "longitude": 2.77877,
        "latitude": 48.871662
      }
    },
    {
      "id": "53895b6d-d25d-4e08-a489-0c3d47dd183f",
      "name": "Disneyland Railroad Frontierland Depot",
      "entityType": "ATTRACTION",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1RA10",
      "location": {
        "longitude": 2.772255,
        "latitude": 48.870246
      }
    },
    {
      "id": "a5afa85c-ee58-4f47-8626-fa4057e7d266",
      "name": "Disneyland Railroad Main Street Station",
      "entityType": "ATTRACTION",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1MA05",
      "location": {
        "longitude": 2.77909,
        "latitude": 48.870814
      }
    },
    {
      "id": "46406e4a-4a02-4d30-89bc-ef1ed63c1ff9",
      "name": "Dumbo the Flying Elephant",
      "entityType": "ATTRACTION",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1NA05",
      "location": {
        "longitude": 2.774606,
        "latitude": 48.874152
      }
    },
    {
      "id": "03871aa6-a0b5-41ee-8fd3-b2f4b8dccc79",
      "name": "Frontierland Playground",
      "entityType": "ATTRACTION",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1RA07",
      "location": {
        "longitude": 2.774223,
        "latitude": 48.870336
      }
    },
    {
      "id": "6bb88973-80d0-45cf-bffe-433f1c551362",
      "name": "Horse-Drawn Streetcars",
      "entityType": "ATTRACTION",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1MA02",
      "location": {
        "longitude": 2.778806,
        "latitude": 48.871058
      }
    },
    {
      "id": "5d0ce227-7ad0-4402-a95b-6cf56f25a8ec",
      "name": "Indiana Jones™ and the Temple of Peril",
      "entityType": "ATTRACTION",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1AA02",
      "location": {
        "longitude": 2.772029,
        "latitude": 48.872429
      }
    },
    {
      "id": "7e426533-7727-47e5-8c8e-0dcd46198e57",
      "name": "La Cabane des Robinson",
      "entityType": "ATTRACTION",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1AA01",
      "location": {
        "longitude": 2.773744,
        "latitude": 48.872336
      }
    },
    {
      "id": "38bafc85-cb48-488e-aa68-3e2d01ae6a10",
      "name": "La Galerie de la Belle au Bois Dormant",
      "entityType": "ATTRACTION",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1NA06",
      "location": {
        "longitude": 2.776212,
        "latitude": 48.873101
      }
    },
    {
      "id": "83fa9e7f-4a25-4bee-8e61-4fb8c59cd350",
      "name": "La Tanière du Dragon",
      "entityType": "ATTRACTION",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1NA12",
      "location": {
        "longitude": 2.775918,
        "latitude": 48.87308
      }
    },
    {
      "id": "ced30c44-9b79-45de-a8c9-6347298756c1",
      "name": "Le Carrousel de Lancelot ",
      "entityType": "ATTRACTION",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1NA02",
      "location": {
        "longitude": 2.775168,
        "latitude": 48.873908
      }
    },
    {
      "id": "337bce77-57bd-49c7-83d7-662f16c162ea",
      "name": "Slinky® Dog Zigzag Spin",
      "entityType": "ATTRACTION",
      "slug": null,
      "parentId": "ca888437-ebb4-4d50-aed2-d227f7096968",
      "externalId": "P2XA08",
      "location": {
        "longitude": 2.776959,
        "latitude": 48.867136
      }
    },
    {
      "id": "07782089-5e83-4bee-8a39-735818551844",
      "name": "Le Passage Enchanté d'Aladdin",
      "entityType": "ATTRACTION",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1AA03",
      "location": {
        "longitude": 2.775416,
        "latitude": 48.872441
      }
    },
    {
      "id": "d8d9f62a-9fa3-4aae-a568-4225afc35924",
      "name": "Les Mystères du Nautilus",
      "entityType": "ATTRACTION",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1DA06",
      "location": {
        "longitude": 2.779553,
        "latitude": 48.873432
      }
    },
    {
      "id": "594dabd8-ddc1-4835-aafa-f654e10ed2db",
      "name": "Les Voyages de Pinocchio",
      "entityType": "ATTRACTION",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1NA13",
      "location": {
        "longitude": 2.775157,
        "latitude": 48.873545
      }
    },
    {
      "id": "a61aeee6-bed5-4890-8209-5249e689b1a1",
      "name": "Liberty Arcade",
      "entityType": "ATTRACTION",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1MA03",
      "location": {
        "longitude": 2.777992,
        "latitude": 48.871154
      }
    },
    {
      "id": "bcc5567f-f00b-4a7d-8ee6-526cc8d3d5de",
      "name": "Mad Hatter's Tea Cups",
      "entityType": "ATTRACTION",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1NA08",
      "location": {
        "longitude": 2.775025,
        "latitude": 48.874365
      }
    },
    {
      "id": "d6c61231-8f9b-40fa-943a-fe1454e185e7",
      "name": "Main Street Vehicles",
      "entityType": "ATTRACTION",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1MA04",
      "location": {
        "longitude": 2.778946,
        "latitude": 48.871327
      }
    },
    {
      "id": "c2e37859-cd32-4a34-9d6f-43d32d744b4e",
      "name": "Meet Mickey Mouse",
      "entityType": "ATTRACTION",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1MA06",
      "location": {
        "longitude": 2.77392,
        "latitude": 48.874422
      }
    },
    {
      "id": "f0525c25-4ea2-49b7-aab5-150b27658fb6",
      "name": "Orbitron®",
      "entityType": "ATTRACTION",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1DA07",
      "location": {
        "longitude": 2.778457,
        "latitude": 48.873486
      }
    },
    {
      "id": "7c5b2c2d-1082-4e5c-b155-dc492db16e6e",
      "name": "Peter Pan's Flight",
      "entityType": "ATTRACTION",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1NA10",
      "location": {
        "longitude": 2.77408,
        "latitude": 48.873838
      }
    },
    {
      "id": "14f756d6-d6fa-4200-8b41-db84ba294fa6",
      "name": "Phantom Manor",
      "entityType": "ATTRACTION",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1RA03",
      "location": {
        "longitude": 2.776827,
        "latitude": 48.870977
      }
    },
    {
      "id": "76e9e917-fe07-49d5-b604-f65d831210fa",
      "name": "Pirate Galleon",
      "entityType": "ATTRACTION",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1AA08",
      "location": {
        "longitude": 2.773621,
        "latitude": 48.872927
      }
    },
    {
      "id": "0d822af0-bf02-47a7-bc29-672d2fa4f7ab",
      "name": "Pirates of the Caribbean",
      "entityType": "ATTRACTION",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1AA04",
      "location": {
        "longitude": 2.773381,
        "latitude": 48.873493
      }
    },
    {
      "id": "2aa73e46-8dcf-4201-b334-db31e6e6ca06",
      "name": "Pirates' Beach",
      "entityType": "ATTRACTION",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1AA05",
      "location": {
        "longitude": 2.773771,
        "latitude": 48.87274
      }
    },
    {
      "id": "78b5e028-1574-4ea5-9ac1-8d5356400044",
      "name": "Princess Pavilion",
      "entityType": "ATTRACTION",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1NA17",
      "location": {
        "longitude": 2.775558,
        "latitude": 48.874745
      }
    },
    {
      "id": "bcbd2214-0f75-4cae-8cff-087adf621330",
      "name": "Rustler Roundup Shootin' Gallery",
      "entityType": "ATTRACTION",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1RA05",
      "location": {
        "longitude": 2.775611,
        "latitude": 48.871546
      }
    },
    {
      "id": "a620015d-091d-4f82-b8b2-a97bc8641f07",
      "name": "Sleeping Beauty Castle",
      "entityType": "ATTRACTION",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1NA04",
      "location": {
        "longitude": 2.776308,
        "latitude": 48.873057
      }
    },
    {
      "id": "5d10b8b2-7d34-4794-8857-76688e5864bc",
      "name": "Star Tours: The Adventures Continue*",
      "entityType": "ATTRACTION",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1DA09",
      "location": {
        "longitude": 2.778782,
        "latitude": 48.874677
      }
    },
    {
      "id": "ddca340c-7ba1-4f23-89eb-0d3d52c84bda",
      "name": "Star Wars Hyperspace Mountain",
      "entityType": "ATTRACTION",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1DA08",
      "location": {
        "longitude": 2.778863,
        "latitude": 48.873651
      }
    },
    {
      "id": "323bec06-fef7-4a60-989d-e3fcf9d3db7e",
      "name": "Thunder Mesa Riverboat Landing",
      "entityType": "ATTRACTION",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1RA06",
      "location": {
        "longitude": 2.776563,
        "latitude": 48.871173
      }
    },
    {
      "id": "ced66356-4eca-482d-86ef-958e4a7dc87f",
      "name": "Welcome to Starport: A Star Wars Encounter",
      "entityType": "ATTRACTION",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1DA14",
      "location": {
        "longitude": 2.778952270746231,
        "latitude": 48.874543615495014
      }
    },
    {
      "id": "c07e4a0d-341c-480f-a4ea-ae7609a5eec7",
      "name": "Disney Performing Arts Programme",
      "entityType": "SHOW",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "ENDPAP07",
      "location": {
        "longitude": 2.778097,
        "latitude": 48.874057
      }
    },
    {
      "id": "d944b02c-12ce-4176-ac62-6a936f180b5c",
      "name": "Cars Quatre Roues Rallye",
      "entityType": "ATTRACTION",
      "slug": null,
      "parentId": "ca888437-ebb4-4d50-aed2-d227f7096968",
      "externalId": "P2XA02",
      "location": {
        "longitude": 2.777854,
        "latitude": 48.867726
      }
    },
    {
      "id": "449a20d8-9bfd-4b2b-b437-38a279aa8d88",
      "name": "Cars ROAD TRIP",
      "entityType": "ATTRACTION",
      "slug": null,
      "parentId": "ca888437-ebb4-4d50-aed2-d227f7096968",
      "externalId": "P2XA00",
      "location": {
        "longitude": 2.775024175643921,
        "latitude": 48.86651889190989
      }
    },
    {
      "id": "f0d4b531-e291-471b-9527-00410c2bbd65",
      "name": "Crush's Coaster",
      "entityType": "ATTRACTION",
      "slug": null,
      "parentId": "ca888437-ebb4-4d50-aed2-d227f7096968",
      "externalId": "P2XA03",
      "location": {
        "longitude": 2.778142,
        "latitude": 48.868041
      }
    },
    {
      "id": "8e229723-51c1-4668-b956-5bc45305acd9",
      "name": "Les Tapis Volants - Flying Carpets Over Agrabah®",
      "entityType": "ATTRACTION",
      "slug": null,
      "parentId": "ca888437-ebb4-4d50-aed2-d227f7096968",
      "externalId": "P2XA05",
      "location": {
        "longitude": 2.778352,
        "latitude": 48.868288
      }
    },
    {
      "id": "15bad9c3-8378-4ac5-ab90-2f8d0ee09d26",
      "name": "RC Racer",
      "entityType": "ATTRACTION",
      "slug": null,
      "parentId": "ca888437-ebb4-4d50-aed2-d227f7096968",
      "externalId": "P2XA06",
      "location": {
        "longitude": 2.776651,
        "latitude": 48.866903
      }
    },
    {
      "id": "d2ec9363-a215-4904-b297-b66734ea9a00",
      "name": "The Twilight Zone Tower of Terror",
      "entityType": "ATTRACTION",
      "slug": null,
      "parentId": "ca888437-ebb4-4d50-aed2-d227f7096968",
      "externalId": "P2ZA02",
      "location": {
        "longitude": 2.778767,
        "latitude": 48.866753
      }
    },
    {
      "id": "a10b25e2-3176-449a-a8a5-4119902887bb",
      "name": "Toy Soldiers Parachute Drop",
      "entityType": "ATTRACTION",
      "slug": null,
      "parentId": "ca888437-ebb4-4d50-aed2-d227f7096968",
      "externalId": "P2XA07",
      "location": {
        "longitude": 2.777234,
        "latitude": 48.867188
      }
    },
    {
      "id": "3bdddd5f-6ec1-4143-a915-2e95b2fa275f",
      "name": "Animation Academy",
      "entityType": "SHOW",
      "slug": null,
      "parentId": "ca888437-ebb4-4d50-aed2-d227f7096968",
      "externalId": "P2GS54",
      "location": {
        "longitude": 2.7783317864486885,
        "latitude": 48.86742740189942
      }
    },
    {
      "id": "085c656d-17b6-4e71-b39c-ff37d2b030a8",
      "name": "Musical Meet-up with Rapunzel and Flynn",
      "entityType": "SHOW",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1G112",
      "location": {
        "longitude": 2.7752360701560974,
        "latitude": 48.87492172292716
      }
    },
    {
      "id": "338ad2c6-18db-457c-a790-1fff0a5c852b",
      "name": "Moana and her Musicians",
      "entityType": "SHOW",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1G110",
      "location": {
        "longitude": 2.772757709026337,
        "latitude": 48.87197205688676
      }
    },
    {
      "id": "a970c245-4924-48bd-bced-efc14850b116",
      "name": "Mickey’s PhilharMagic",
      "entityType": "SHOW",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1G103",
      "location": {
        "longitude": 2.7798494696617126,
        "latitude": 48.87445952598315
      }
    },
    {
      "id": "a9d05b33-ac9c-4ff3-b2f6-7c0c037ee634",
      "name": "Avengers Unite!",
      "entityType": "SHOW",
      "slug": null,
      "parentId": "ca888437-ebb4-4d50-aed2-d227f7096968",
      "externalId": "avengersUnite",
      "location": {
        "longitude": 2.7792432904243474,
        "latitude": 48.86529938361131
      }
    },
    {
      "id": "4e9e9271-1962-4fad-9f73-9370954018cf",
      "name": "Reserved viewing area: Nighttime show",
      "entityType": "SHOW",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1RV00",
      "location": {
        "longitude": 2.776491343975067,
        "latitude": 48.87216259080832
      }
    },
    {
      "id": "f2a48cc2-4dc3-47fd-9992-0c30eeba24f0",
      "name": "Stitch Live!",
      "entityType": "SHOW",
      "slug": null,
      "parentId": "ca888437-ebb4-4d50-aed2-d227f7096968",
      "externalId": "P2YS03",
      "location": {
        "longitude": 2.780080139636994,
        "latitude": 48.86661211095515
      }
    },
    {
      "id": "db40febf-0db9-4eb6-a7d5-1a59fb43174b",
      "name": "Disney Music Hits Concert",
      "entityType": "SHOW",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1G107",
      "location": {
        "longitude": 2.7780631184577946,
        "latitude": 48.87412434232196
      }
    },
    {
      "id": "cb2a262d-48f5-479e-916c-0ca8be64914e",
      "name": "Timon's Matadance",
      "entityType": "SHOW",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1G109",
      "location": {
        "longitude": 2.774549424648285,
        "latitude": 48.87295647433795
      }
    },
    {
      "id": "9e41b79b-e558-4e5f-a2ec-ad4f81474632",
      "name": "The Amazing Spider-Man! ",
      "entityType": "SHOW",
      "slug": null,
      "parentId": "ca888437-ebb4-4d50-aed2-d227f7096968",
      "externalId": "theAmazingSpiderMan",
      "location": {
        "longitude": 2.779307663440705,
        "latitude": 48.865698145827615
      }
    },
    {
      "id": "08e247d6-21c9-4682-91f5-6e0fa6f93ed4",
      "name": "Heroic Welcome",
      "entityType": "SHOW",
      "slug": null,
      "parentId": "ca888437-ebb4-4d50-aed2-d227f7096968",
      "externalId": "heroicWelcome",
      "location": {
        "longitude": 2.7792593836784363,
        "latitude": 48.86530644137726
      }
    },
    {
      "id": "435401f8-b158-4e2b-b3e1-d824d75570fc",
      "name": "Reserved viewing area: Disney Stars on Parade",
      "entityType": "SHOW",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1RV01",
      "location": {
        "longitude": 2.7770224213600163,
        "latitude": 48.87272360314155
      }
    },
    {
      "id": "777518c2-1c65-48ba-94a1-e19583c44bf5",
      "name": "Disney Stars on Parade ",
      "entityType": "SHOW",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1GS21",
      "location": {
        "longitude": 2.778213322162628,
        "latitude": 48.86738491014254
      }
    },
    {
      "id": "0f5cce1d-69ed-4fad-9505-a1914dd150cb",
      "name": "Mickey and the Magician",
      "entityType": "SHOW",
      "slug": null,
      "parentId": "ca888437-ebb4-4d50-aed2-d227f7096968",
      "externalId": "P2YS08",
      "location": {
        "longitude": 2.7791735529899597,
        "latitude": 48.86815769739524
      }
    },
    {
      "id": "6faef4e4-0c9b-4328-9b7d-8fb0ee980de8",
      "name": "The Grand Orchestra Finale",
      "entityType": "SHOW",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1G104",
      "location": {
        "longitude": 2.7770975232124333,
        "latitude": 48.8724660322225
      }
    },
    {
      "id": "e3b0aefc-5834-4275-9e6c-d97b8ee71a6b",
      "name": "Frozen: A Musical Invitation",
      "entityType": "SHOW",
      "slug": null,
      "parentId": "ca888437-ebb4-4d50-aed2-d227f7096968",
      "externalId": "P2GS23",
      "location": {
        "longitude": 2.7781972289085393,
        "latitude": 48.86736726645861
      }
    },
    {
      "id": "72d20d9c-1f46-4866-b9b9-b428d0aaf6e8",
      "name": "TOGETHER: a Pixar Musical Adventure",
      "entityType": "SHOW",
      "slug": null,
      "parentId": "ca888437-ebb4-4d50-aed2-d227f7096968",
      "externalId": "P2GS58",
      "location": {
        "longitude": 2.780265212059021,
        "latitude": 48.867309630452866
      }
    },
    {
      "id": "bbd4b4b6-cf2b-47b2-a3a7-472b72851e54",
      "name": "Minnie’s Marching Band",
      "entityType": "SHOW",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1G113",
      "location": {
        "longitude": 2.7773147821426396,
        "latitude": 48.872186113536166
      }
    },
    {
      "id": "78abb817-4564-41e2-b0de-fa0df34664c1",
      "name": "The Lion King: Rhythms of the Pride Lands",
      "entityType": "SHOW",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1GS34",
      "location": {
        "longitude": 2.7728059887886047,
        "latitude": 48.87001022097784
      }
    },
    {
      "id": "2e3f2f0b-07b2-4948-a578-0901b855488d",
      "name": "Miguel's Fiesta Latina",
      "entityType": "SHOW",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1G108",
      "location": {
        "longitude": 2.7759388089179997,
        "latitude": 48.871562759342396
      }
    },
    {
      "id": "79ac89c7-89dc-4436-aa49-4cb2d2ee2b4b",
      "name": "Mary Poppins and the Pearly Band",
      "entityType": "SHOW",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1G105",
      "location": {
        "longitude": 2.7786424756050114,
        "latitude": 48.871171100798634
      }
    },
    {
      "id": "c374dbae-37a4-4b92-b06c-441b2e5cd8f5",
      "name": "Donald and Daisy's Accordionist",
      "entityType": "SHOW",
      "slug": null,
      "parentId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1G111",
      "location": {
        "longitude": 2.7766683697700505,
        "latitude": 48.874597127046464
      }
    }
  ]
}

Response headers

 access-control-allow-origin: *  alt-svc: h3=":443"; ma=86400  cache-control: public,max-age=60,s-maxage=3600  cf-cache-status: DYNAMIC  cf-ray: 978b538d2bd4751f-AMS  content-encoding: gzip  content-type: application/json; charset=utf-8  date: Tue,02 Sep 2025 07:34:41 GMT  etag: W/"aa71-swLu/KySa8im2HZagAKjX68aG1I"  nel: {"report_to":"heroku-nel","response_headers":["Via"],"max_age":3600,"success_fraction":0.01,"failure_fraction":0.1}  report-to: {"group":"heroku-nel","endpoints":[{"url":"https://nel.heroku.com/reports?s=eBaXyDOzsE6GwDAKZ6DgKCXWJSnYMoTK8W2YT0h%2FQUY%3D\u0026sid=812dcc77-0bd0-43b1-a5f1-b25750382959\u0026ts=1756798481"}],"max_age":3600}  reporting-endpoints: heroku-nel="https://nel.heroku.com/reports?s=eBaXyDOzsE6GwDAKZ6DgKCXWJSnYMoTK8W2YT0h%2FQUY%3D&sid=812dcc77-0bd0-43b1-a5f1-b25750382959&ts=1756798481"  server: cloudflare  server-timing: cfL4;desc="?proto=TCP&rtt=26244&min_rtt=6468&rtt_var=23751&sent=110&recv=83&lost=0&retrans=1&sent_bytes=74300&recv_bytes=7427&delivery_rate=3632844&cwnd=255&unsent_bytes=0&cid=25fd2af67d2c1622&ts=344324&x=0"  strict-transport-security: max-age=2592000  vary: Accept-Encoding  via: 2.0 heroku-router  x-firefox-spdy: h2 

Responses
Code	Description	Links
200	

successful fetch
Media type
Controls Accept header.

{
  "id": "string",
  "name": "string",
  "entityType": "DESTINATION",
  "timezone": "string",
  "children": [
    {
      "id": "string",
      "name": "string",
      "entityType": "DESTINATION",
      "externalId": "string",
      "parentId": "string",
      "location": {
        "latitude": 0,
        "longitude": 0
      }
    }
  ]
}

	No links
GET
/entity/{entityID}/live
Get live data for this entity and any child entities

Fetch this entity's live data (queue times, parade times, etc.) as well as all child entities. For a destination, this will include all parks within that destination.
Parameters
Name	Description
entityID *
string
(path)
	

Entity ID (or slug) to fetch
Responses
Curl

curl -X 'GET' \
  'https://api.themeparks.wiki/v1/entity/852d957c-382e-4afb-bb74-70c9a79055df/live' \
  -H 'accept: application/json'

Request URL

https://api.themeparks.wiki/v1/entity/852d957c-382e-4afb-bb74-70c9a79055df/live

Server response
Code	Details
200	
Response body
Download

{
  "id": "852d957c-382e-4afb-bb74-70c9a79055df",
  "name": "Big Thunder Mountain",
  "entityType": "ATTRACTION",
  "timezone": "Europe/Paris",
  "liveData": [
    {
      "id": "852d957c-382e-4afb-bb74-70c9a79055df",
      "name": "Big Thunder Mountain",
      "entityType": "ATTRACTION",
      "parkId": "dae968d5-630d-4719-8b06-3d107e944401",
      "externalId": "P1RA00",
      "queue": {
        "STANDBY": {
          "waitTime": 15
        },
        "PAID_RETURN_TIME": {
          "price": {
            "amount": 1300,
            "currency": "EUR",
            "formatted": "13,00 €"
          },
          "state": "AVAILABLE",
          "returnEnd": "2025-09-02T10:35:00+02:00",
          "returnStart": "2025-09-02T09:35:00+02:00"
        }
      },
      "status": "OPERATING",
      "lastUpdated": "2025-09-02T07:30:26Z"
    }
  ]
}

Response headers

 access-control-allow-origin: *  alt-svc: h3=":443"; ma=86400  cache-control: public,max-age=60,s-maxage=60  cf-cache-status: DYNAMIC  cf-ray: 978b5720e84a751f-AMS  content-encoding: zstd  content-type: application/json; charset=utf-8  date: Tue,02 Sep 2025 07:37:08 GMT  etag: W/"353-0EZjY7lAYrtX/eVPJTQgMdQzTq4"  nel: {"report_to":"heroku-nel","response_headers":["Via"],"max_age":3600,"success_fraction":0.01,"failure_fraction":0.1}  report-to: {"group":"heroku-nel","endpoints":[{"url":"https://nel.heroku.com/reports?s=MaMxaleSH5uHYgWJAiB%2B3Y4YFlEeoYUXZA4DadQBQ%2BU%3D\u0026sid=812dcc77-0bd0-43b1-a5f1-b25750382959\u0026ts=1756798628"}],"max_age":3600}  reporting-endpoints: heroku-nel="https://nel.heroku.com/reports?s=MaMxaleSH5uHYgWJAiB%2B3Y4YFlEeoYUXZA4DadQBQ%2BU%3D&sid=812dcc77-0bd0-43b1-a5f1-b25750382959&ts=1756798628"  server: cloudflare  server-timing: cfL4;desc="?proto=TCP&rtt=34090&min_rtt=6727&rtt_var=26888&sent=143&recv=107&lost=0&retrans=1&sent_bytes=88838&recv_bytes=8295&delivery_rate=3632844&cwnd=255&unsent_bytes=0&cid=25fd2af67d2c1622&ts=490834&x=0"  strict-transport-security: max-age=2592000  vary: Accept-Encoding  via: 2.0 heroku-router  x-firefox-spdy: h2 

Responses
Code	Description	Links
200	

successful fetch
Media type
Controls Accept header.

{
  "id": "string",
  "name": "string",
  "entityType": "DESTINATION",
  "timezone": "string",
  "liveData": [
    {
      "id": "string",
      "name": "string",
      "entityType": "DESTINATION",
      "status": "OPERATING",
      "lastUpdated": "2025-09-02T07:38:27.925Z",
      "queue": {
        "STANDBY": {
          "waitTime": 0
        },
        "SINGLE_RIDER": {
          "waitTime": 0
        },
        "RETURN_TIME": {
          "state": "AVAILABLE",
          "returnStart": "2025-09-02T07:38:27.925Z",
          "returnEnd": "2025-09-02T07:38:27.925Z"
        },
        "PAID_RETURN_TIME": {
          "state": "AVAILABLE",
          "returnStart": "2025-09-02T07:38:27.925Z",
          "returnEnd": "2025-09-02T07:38:27.925Z",
          "price": {
            "amount": 0,
            "currency": "string",
            "formatted": "string"
          }
        },
        "BOARDING_GROUP": {
          "allocationStatus": "AVAILABLE",
          "currentGroupStart": 0,
          "currentGroupEnd": 0,
          "nextAllocationTime": "2025-09-02T07:38:27.925Z",
          "estimatedWait": 0
        },
        "PAID_STANDBY": {
          "waitTime": 0
        }
      },
      "showtimes": [
        {
          "type": "string",
          "startTime": "2025-09-02T07:38:27.925Z",
          "endTime": "2025-09-02T07:38:27.925Z"
        }
      ],
      "operatingHours": [
        {
          "type": "string",
          "startTime": "2025-09-02T07:38:27.925Z",
          "endTime": "2025-09-02T07:38:27.925Z"
        }
      ],
      "diningAvailability": [
        {
          "partySize": 0,
          "waitTime": 0
        }
      ]
    }
  ]
}

	No links
GET
/entity/{entityID}/schedule
Get entity schedule

Fetch this entity's schedule for the next 30 days
Parameters
Name	Description
entityID *
string
(path)
	

Entity ID (or slug) to fetch
Responses
Curl

curl -X 'GET' \
  'https://api.themeparks.wiki/v1/entity/7c5b2c2d-1082-4e5c-b155-dc492db16e6e/schedule' \
  -H 'accept: application/json'

Request URL

https://api.themeparks.wiki/v1/entity/7c5b2c2d-1082-4e5c-b155-dc492db16e6e/schedule

Server response
Code	Details
200	
Response body
Download

{
  "id": "7c5b2c2d-1082-4e5c-b155-dc492db16e6e",
  "name": "Peter Pan's Flight",
  "entityType": "ATTRACTION",
  "timezone": "Europe/Paris",
  "schedule": [
    {
      "date": "2025-09-20",
      "type": "OPERATING",
      "closingTime": "2025-09-20T21:40:00+02:00",
      "openingTime": "2025-09-20T08:30:00+02:00"
    },
    {
      "date": "2025-09-21",
      "type": "OPERATING",
      "closingTime": "2025-09-21T21:00:00+02:00",
      "openingTime": "2025-09-21T08:30:00+02:00"
    },
    {
      "date": "2025-09-22",
      "type": "OPERATING",
      "closingTime": "2025-09-22T20:00:00+02:00",
      "openingTime": "2025-09-22T08:30:00+02:00"
    },
    {
      "date": "2025-09-23",
      "type": "OPERATING",
      "closingTime": "2025-09-23T20:00:00+02:00",
      "openingTime": "2025-09-23T08:30:00+02:00"
    },
    {
      "date": "2025-09-24",
      "type": "OPERATING",
      "closingTime": "2025-09-24T20:00:00+02:00",
      "openingTime": "2025-09-24T08:30:00+02:00"
    },
    {
      "date": "2025-09-25",
      "type": "OPERATING",
      "closingTime": "2025-09-25T20:00:00+02:00",
      "openingTime": "2025-09-25T08:30:00+02:00"
    },
    {
      "date": "2025-09-26",
      "type": "OPERATING",
      "closingTime": "2025-09-26T20:00:00+02:00",
      "openingTime": "2025-09-26T08:30:00+02:00"
    },
    {
      "date": "2025-09-27",
      "type": "OPERATING",
      "closingTime": "2025-09-27T21:40:00+02:00",
      "openingTime": "2025-09-27T08:30:00+02:00"
    },
    {
      "date": "2025-09-28",
      "type": "OPERATING",
      "closingTime": "2025-09-28T21:00:00+02:00",
      "openingTime": "2025-09-28T08:30:00+02:00"
    },
    {
      "date": "2025-09-29",
      "type": "OPERATING",
      "closingTime": "2025-09-29T20:00:00+02:00",
      "openingTime": "2025-09-29T08:30:00+02:00"
    },
    {
      "date": "2025-09-30",
      "type": "OPERATING",
      "closingTime": "2025-09-30T20:00:00+02:00",
      "openingTime": "2025-09-30T08:30:00+02:00"
    },
    {
      "date": "2025-10-01",
      "type": "OPERATING",
      "closingTime": "2025-10-01T21:00:00+02:00",
      "openingTime": "2025-10-01T08:30:00+02:00"
    },
    {
      "date": "2025-10-02",
      "type": "OPERATING",
      "closingTime": "2025-10-02T21:00:00+02:00",
      "openingTime": "2025-10-02T08:30:00+02:00"
    }
  ]
}

Response headers

 access-control-allow-origin: *  alt-svc: h3=":443"; ma=86400  cache-control: public,max-age=60,s-maxage=3600  cf-cache-status: DYNAMIC  cf-ray: 978b55829e70751f-AMS  content-encoding: gzip  content-length: 352  content-type: application/json; charset=utf-8  date: Tue,02 Sep 2025 07:36:01 GMT  etag: W/"91d-OzhLHTSEBbmO1TzUEFq711+F+Tg"  nel: {"report_to":"heroku-nel","response_headers":["Via"],"max_age":3600,"success_fraction":0.01,"failure_fraction":0.1}  report-to: {"group":"heroku-nel","endpoints":[{"url":"https://nel.heroku.com/reports?s=OW8iMRZl%2BE9uLmbFgnhREDjTC6hQMgvWau7gH5lueYc%3D\u0026sid=812dcc77-0bd0-43b1-a5f1-b25750382959\u0026ts=1756798561"}],"max_age":3600}  reporting-endpoints: heroku-nel="https://nel.heroku.com/reports?s=OW8iMRZl%2BE9uLmbFgnhREDjTC6hQMgvWau7gH5lueYc%3D&sid=812dcc77-0bd0-43b1-a5f1-b25750382959&ts=1756798561"  server: cloudflare  server-timing: cfL4;desc="?proto=TCP&rtt=30299&min_rtt=6468&rtt_var=27406&sent=133&recv=99&lost=0&retrans=1&sent_bytes=86303&recv_bytes=7978&delivery_rate=3632844&cwnd=255&unsent_bytes=0&cid=25fd2af67d2c1622&ts=424533&x=0"  strict-transport-security: max-age=2592000  vary: Accept-Encoding  via: 2.0 heroku-router  x-firefox-spdy: h2 

Responses
Code	Description	Links
200	

successful fetch
Media type
Controls Accept header.

{
  "id": "string",
  "name": "string",
  "entityType": "DESTINATION",
  "timezone": "string",
  "schedule": [
    {
      "date": "string",
      "openingTime": "2025-09-02T07:38:27.933Z",
      "closingTime": "2025-09-02T07:38:27.933Z",
      "type": "OPERATING",
      "purchases": [
        {
          "type": "ADMISSION",
          "id": "string",
          "name": "string",
          "price": {
            "amount": 0,
            "currency": "string",
            "formatted": "string"
          },
          "available": true
        }
      ]
    }
  ],
  "parks": [
    "string"
  ]
}

	No links
GET
/entity/{entityID}/schedule/{year}/{month}
Get entity schedule for a specific month and year

Fetch this entity's schedule for the supplied year and month
Parameters
Name	Description
entityID *
string
(path)
	

Entity ID (or slug) to fetch
year *
number
(path)
	

Schedule year to fetch
month *
number
(path)
	

Schedule month to fetch. Must be a two digit zero-padded month.
Responses
Curl

curl -X 'GET' \
  'https://api.themeparks.wiki/v1/entity/7c5b2c2d-1082-4e5c-b155-dc492db16e6e/schedule/2026/01' \
  -H 'accept: application/json'

Request URL

https://api.themeparks.wiki/v1/entity/7c5b2c2d-1082-4e5c-b155-dc492db16e6e/schedule/2026/01

Server response
Code	Details
200	
Response body
Download

{
  "id": "7c5b2c2d-1082-4e5c-b155-dc492db16e6e",
  "name": "Peter Pan's Flight",
  "entityType": "ATTRACTION",
  "timezone": "Europe/Paris",
  "schedule": []
}

Response headers

 access-control-allow-origin: *  alt-svc: h3=":443"; ma=86400  cache-control: public,max-age=60,s-maxage=3600  cf-cache-status: DYNAMIC  cf-ray: 978b565fa832751f-AMS  content-encoding: zstd  content-type: application/json; charset=utf-8  date: Tue,02 Sep 2025 07:36:37 GMT  etag: W/"a0-+FgSSUyykDpVFSLjxagKMOvQq0w"  nel: {"report_to":"heroku-nel","response_headers":["Via"],"max_age":3600,"success_fraction":0.01,"failure_fraction":0.1}  report-to: {"group":"heroku-nel","endpoints":[{"url":"https://nel.heroku.com/reports?s=T8ry8OkZoV5JjZ5ApfTLB7gWeKxrM6SLEYjUdRMXsAw%3D\u0026sid=812dcc77-0bd0-43b1-a5f1-b25750382959\u0026ts=1756798597"}],"max_age":3600}  reporting-endpoints: heroku-nel="https://nel.heroku.com/reports?s=T8ry8OkZoV5JjZ5ApfTLB7gWeKxrM6SLEYjUdRMXsAw%3D&sid=812dcc77-0bd0-43b1-a5f1-b25750382959&ts=1756798597"  server: cloudflare  server-timing: cfL4;desc="?proto=TCP&rtt=33749&min_rtt=6468&rtt_var=26003&sent=139&recv=104&lost=0&retrans=1&sent_bytes=88037&recv_bytes=8192&delivery_rate=3632844&cwnd=255&unsent_bytes=0&cid=25fd2af67d2c1622&ts=459899&x=0"  strict-transport-security: max-age=2592000  vary: Accept-Encoding  via: 2.0 heroku-router  x-firefox-spdy: h2 

Responses
Code	Description	Links
200	

successful fetch
Media type
Controls Accept header.

{
  "id": "string",
  "name": "string",
  "entityType": "DESTINATION",
  "timezone": "string",
  "schedule": [
    {
      "date": "string",
      "openingTime": "2025-09-02T07:38:27.938Z",
      "closingTime": "2025-09-02T07:38:27.938Z",
      "type": "OPERATING",
      "purchases": [
        {
          "type": "ADMISSION",
          "id": "string",
          "name": "string",
          "price": {
            "amount": 0,
            "currency": "string",
            "formatted": "string"
          },
          "available": true
        }
      ]
    }
  ],
  "parks": [
    "string"
  ]
}

	No links
Schemas
EntityType
LiveStatusType
ReturnTimeState
BoardingGroupState
PriceData{
amount*	[...]
currency*	[...]
formatted	[...]
}
LiveQueue
LiveShowTime
DiningAvailability
TagData
EntityData
EntityChild
EntityChildrenResponse
EntityLiveData
EntityLiveDataResponse
SchedulePriceObject
ScheduleEntry
EntityScheduleResponse
DestinationParkEntry
DestinationEntry
DestinationsResponse
