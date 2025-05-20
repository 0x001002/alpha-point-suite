import { ConnectButton } from './ConnectButton';
import Link from 'next/link';
import Image from 'next/image';
import styles from './Header.module.css';

export const Header = () => {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.logoLink}>
          <Image
            src="/logo.png"
            alt="Logo"
            width={32}
            height={32}
            className={styles.logo}
          />
          <span className={styles.title}>Alpha Point</span>
        </Link>
        
        <div className={styles.rightSection}>
          <a
            href="https://t.me/alphapointfun"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.telegramLink}
          >
            <Image
              src="/tel.webp"
              alt="Telegram"
              width={24}
              height={24}
              className={styles.telegramIcon}
            />
          </a>
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}; 