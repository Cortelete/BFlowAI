import React, { useEffect } from 'react';

interface PageProps {
  title: string;
  children: React.ReactNode;
}

/**
 * A wrapper component that sets the document title for each page.
 * This enhances the feeling of navigating between distinct pages.
 */
const Page: React.FC<PageProps> = ({ title, children }) => {
  useEffect(() => {
    document.title = `${title} | BeautyFlow AI`;
  }, [title]);

  return <>{children}</>;
};

export default Page;
