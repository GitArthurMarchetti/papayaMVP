import Image from "next/image";

export default function Header() {
    return (
             <header className="flex h-[8%] w-full items-center justify-between bg-white px-10 shadow-md">
                <Image
                  height={200}
                  width={200}
                  alt=''
                  src={'/logo-1.png.webp'}
                />
              </header>
    )
}