package app.stickandplay.kids;

import android.content.res.Configuration;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.WindowManager;
import android.webkit.WebView;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private final Handler handler = new Handler(Looper.getMainLooper());

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // keep the screen awake while the child plays
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        hideSystemBars();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            hideSystemBars();
            checkViewport();
        }
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        checkViewport();
    }

    @Override
    public void onDestroy() {
        handler.removeCallbacks(fitPage);
        super.onDestroy();
    }

    // full screen: status and navigation bars hidden, a swipe from the edge shows them briefly
    private void hideSystemBars() {
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        WindowInsetsControllerCompat c = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        c.hide(WindowInsetsCompat.Type.systemBars());
        c.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    }

    // The page must fill the web view. When the screen density changes while the app runs (a Samsung tablet going into
    // DeX, "Display size" in the settings), the activity is not restarted (android:configChanges has "density"), and the
    // web view keeps the page's old size in CSS px while it already draws at the new density: the game was a quarter of
    // the window, in its top left corner (2026-11-23). The web view works the page's size out only when its own size
    // in pixels changes, so the page is asked how wide it is, and if that is not the web view's width, the web view is
    // made one pixel narrower and back. Asked a few times: the web view learns the new density a little later than
    // the activity does.
    private static final int[] VIEWPORT_CHECKS_MS = { 100, 500, 1500, 4000 };
    private final Runnable fitPage = this::fitPage;

    private void checkViewport() {
        handler.removeCallbacks(fitPage);
        for (int ms : VIEWPORT_CHECKS_MS) handler.postDelayed(fitPage, ms);
    }

    private void fitPage() {
        final WebView web = getBridge() == null ? null : getBridge().getWebView();
        if (web == null || web.getWidth() == 0) return;
        web.evaluateJavascript("innerWidth * devicePixelRatio", value -> {
            float page;
            try {
                page = Float.parseFloat(value);
            } catch (Exception e) {
                return;   // no page yet
            }
            int width = web.getWidth();
            if (page <= 0 || width == 0 || Math.abs(page - width) <= width * 0.03f) return;
            web.setRight(web.getRight() - 1);
            web.setRight(web.getRight() + 1);
        });
    }
}
