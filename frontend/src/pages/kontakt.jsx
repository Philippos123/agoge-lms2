'use client'
import Navbar from "../components/navbar"

const people = [
  {
    name: "Philip Samaras",
    role: "Co-Founder / CEO",
    phone: "070-123 45 67",
    email: "Philip.samaras@agoge.se",
    image: "https://media.licdn.com/dms/image/v2/D4D03AQHol1KFdfzZQw/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1722599513771?e=2147483647&v=beta&t=-DIw3gXI0tjWGc0sCo-_Lyjrv1J7a2DAcbtpEHkyeCE",
    description: "Kontakta Philip för att diskutera affärsmöjligheter, köpa våra tjänster eller integrera dina kurser i vårt system."
  },
]

const TeamCard = ({ person }) => (
  <div className="bg-white rounded-lg shadow-lg p-6 text-center transform transition duration-300 hover:scale-105">
    <img
      src={person.image}
      alt={person.name}
      className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-2 border-blue-600"
    />
    <h3 className="text-xl font-semibold text-gray-800">{person.name}</h3>
    <p className="text-gray-600 mb-2">{person.role}</p>
    <p className="text-gray-500 mb-4">{person.description}</p>
    <div className="space-y-2">
      <a
        href={`mailto:${person.email}`}
        className="block text-blue-600 font-semibold hover:underline"
      >
        {person.email}
      </a>
      <a
        href={`tel:${person.phone}`}
        className="block text-blue-600 font-semibold hover:underline"
      >
        {person.phone}
      </a>
    </div>
  </div>
)

export default function Contact() {
  return (
    <div>
      <Navbar />
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-100 via-blue-50 to-gray-200">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold tracking-tight text-center text-gray-800 mb-6 sm:text-5xl">
          Kontakta oss
        </h2>
        <p className="mt-4 text-lg text-center text-gray-600 max-w-2xl mx-auto">
          Vi gör det enkelt för företag att samarbeta med oss. Kontakta vårt team direkt för support, att ladda upp en kurs eller för att köpa våra tjänster.
        </p>

        <div className="mt-12 bg-blue-50 rounded-lg shadow-lg p-8 text-center max-w-3xl mx-auto">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">
            För företag
          </h3>
          <p className="text-gray-600 mb-6">
            Behöver du support eller vill du ladda upp en kurs i PPTX-format? Kanske vill du diskutera andra affärsmöjligheter? Välj en kontaktväg nedan så hjälper vi dig direkt!
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="mailto:Philip.samaras@agoge.se?subject=Supportförfrågan"
              className="inline-block bg-blue-600 text-white font-semibold py-3 px-6 rounded-md hover:bg-blue-700 transition duration-300"
            >
              Support
            </a>
            <a
              href="mailto:Philip.samaras@agoge.se?subject=Ladda upp kurs"
              className="inline-block bg-blue-800 text-white font-semibold py-3 px-6 rounded-md hover:bg-blue-900 transition duration-300"
            >
              Ladda upp kurs
            </a>
            <a
              href="tel:070-1234567"
              className="inline-block bg-gray-800 text-white font-semibold py-3 px-6 rounded-md hover:bg-gray-900 transition duration-300"
            >
              Ring oss
            </a>
          </div>
        </div>

        <h3 className="mt-16 text-3xl font-semibold text-center text-gray-800 mb-8">
          Möt vårt team
        </h3>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {people.map((person, index) => (
            <TeamCard key={index} person={person} />
          ))}
        </div>
      </div>
    </div>
    </div>
  )
}