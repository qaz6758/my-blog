export const metadata = {
  title: "About",
  description: "About Vince Ou and this personal digital garden.",
};

export default function AboutPage() {
  return (
    <div className="relative w-full overflow-hidden px-6 pt-28 pb-24 sm:px-8 sm:pt-36">
      <main className="relative z-10 mx-auto flex w-full max-w-[660px] flex-col items-start text-left">
        <h1 className="mb-6 font-serif text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-4xl">
          关于我 · About Me
        </h1>

        <div className="mb-8 space-y-4 text-[15px] leading-[1.8] text-neutral-700 dark:text-neutral-300 sm:text-[16px]">
          <p>大道至简，衍化至繁。这里是我的个人数字花园与技术自留地。</p>
        </div>
      </main>
    </div>
  );
}
