'use client';

import { profileQueryOptions } from '@/queries/profile';
import { useQuery } from '@tanstack/react-query';

const ProfileTest = () => {
  const { data } = useQuery(profileQueryOptions);

  return (
    <div>
      <pre className="mt-5">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};
export default ProfileTest;
