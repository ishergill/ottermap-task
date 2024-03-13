import styles from "./page.module.css";
import MapComponent from "../Components/MapComponent";

export default function Home() {
  return (
    <main className={styles.main}>
      <MapComponent />
    </main>
  );
}
