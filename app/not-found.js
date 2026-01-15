// pages/404.js

import Link from 'next/link';
import Image from 'next/image';

const Custom404 = () => {
  return (
    <div className="flex justify-around items-center container">
      {/* <div>
        <Image src="/page-not-found.svg" width={673} height={471} alt='Error 404 page not found' />
      </div>
      <div className=' h-[70vh] py-8'>
        <div className='flex flex-col h-full justify-around'>
          <div>
            <div className='text-[var(--primary-color)] text-8xl font-extrabold'>OOPS!</div>
            <div className='text-2xl'>
              <div>Looks like this package took a wrong turn.</div>
              <div> Let&apos;s reroute together.</div>
            </div>
          </div>
          <div>
            <Link href={'/'}>
              <button className='px-4 py-2 bg-[var(--primary-color)] rounded-lg  text-2xl'>Back to Homepage</button>
            </Link>
          </div>
        </div>
      </div> */}
    </div>
  );
}

export default Custom404;