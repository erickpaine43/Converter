import { Helmet } from 'react-helmet-async';

interface Props {
  title: string;
  description: string;
  path?: string;
}

const BASE_URL = 'https://tu-proyecto.netlify.app';

export default function SeoHead({ title, description, path = '' }: Props) {
  return (
    <Helmet>
      <title>{title} | PDF Converter</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={`${BASE_URL}${path}`} />
      <meta property="og:title" content={`${title} | PDF Converter`} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={`${BASE_URL}${path}`} />
      <meta property="og:type" content="website" />
    </Helmet>
  );
}
